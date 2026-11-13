package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.RegistrationAudit;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.RegistrationAuditRepository;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;
    private final TurnstileService turnstileService;
    private final RegistrationGuardService registrationGuardService;
    private final RegistrationAuditRepository registrationAuditRepository;
    private final TotpService totpService;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.admin-expiration:7200000}")
    private long adminExpiration;

    public LoginResponse login(LoginRequest request, String ip) {
        String username = request.getUsername() == null ? "" : request.getUsername().trim();
        loginAttemptService.assertAllowed(ip, username);
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            loginAttemptService.failure(ip, username);
            throw new RuntimeException("用户名或密码错误");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginAttemptService.failure(ip, username);
            throw new RuntimeException("用户名或密码错误");
        }
        if ("BANNED".equalsIgnoreCase(user.getStatus())) {
            loginAttemptService.failure(ip, username);
            throw new RuntimeException("账号已被封禁");
        }
        loginAttemptService.success(ip, username);

        boolean admin = "ADMIN".equalsIgnoreCase(user.getRole()) || "SUPER_ADMIN".equalsIgnoreCase(user.getRole());
        if (admin && Boolean.TRUE.equals(user.getTotpEnabled())) {
            return LoginResponse.builder()
                    .requires2fa(true)
                    .challengeToken(jwtTokenProvider.generateTwoFactorChallenge(user.getUsername()))
                    .userId(user.getId())
                    .username(user.getUsername())
                    .nickname(user.getNickname() != null ? user.getNickname() : user.getUsername())
                    .role(user.getRole())
                    .status(user.getStatus())
                    .build();
        }
        return buildTokenResponse(user, admin);
    }

    public LoginResponse verifyTwoFactor(String challengeToken, String code) {
        if (!jwtTokenProvider.validateToken(challengeToken) || !"2fa".equals(jwtTokenProvider.getScope(challengeToken))) {
            throw new RuntimeException("二次验证已失效，请重新登录");
        }
        User user = userRepository.findByUsername(jwtTokenProvider.getUsernameFromToken(challengeToken)).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw new RuntimeException("二次验证未启用");
        }
        if (!totpService.verify(user.getTotpSecret(), code)) {
            throw new RuntimeException("验证码错误");
        }
        boolean admin = "ADMIN".equalsIgnoreCase(user.getRole()) || "SUPER_ADMIN".equalsIgnoreCase(user.getRole());
        return buildTokenResponse(user, admin);
    }

    public java.util.Map<String, Object> setupTotp(User user) {
        String secret = totpService.generateSecret();
        user.setTotpSecret(secret);
        user.setTotpEnabled(false);
        userRepository.save(user);
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("secret", secret);
        result.put("otpauthUrl", totpService.otpauthUrl("Baicai", user.getUsername(), secret));
        return result;
    }

    public void enableTotp(User user, String code) {
        if (user.getTotpSecret() == null || !totpService.verify(user.getTotpSecret(), code)) {
            throw new RuntimeException("验证码错误");
        }
        user.setTotpEnabled(true);
        userRepository.save(user);
    }

    public void disableTotp(User user, String password) {
        if (!passwordEncoder.matches(password == null ? "" : password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
    }

    private LoginResponse buildTokenResponse(User user, boolean admin) {
        long expiration = admin ? adminExpiration : jwtExpiration;
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getTokenVersion(), expiration);
        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(expiration)
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname() != null ? user.getNickname() : user.getUsername())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }

    @org.springframework.transaction.annotation.Transactional
    public void register(LoginRequest request, String ip) {
        String username = request.getUsername() == null ? "" : request.getUsername().trim();
        String ipHash = com.baicaiblogs.service.IpBanService.hash(ip == null ? "unknown" : ip);
        registrationGuardService.assertAllowed(ipHash);
        turnstileService.verify(request.getTurnstileToken(), ip);
        try (RegistrationGuardService.Permit ignored = registrationGuardService.acquire(ipHash)) {
            if (username.length() < 3) {
                throw new RuntimeException("用户名至少 3 个字符");
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                throw new RuntimeException("密码至少 6 个字符");
            }
            if (userRepository.existsByUsername(username)) {
                throw new RuntimeException("用户名已存在");
            }

            User user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role("USER")
                    .status("ACTIVE")
                    .build();
            try {
                userRepository.save(user);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                throw new RuntimeException("用户名已存在或注册请求冲突");
            }
            registrationAuditRepository.save(RegistrationAudit.builder()
                    .ipHash(ipHash)
                    .userId(user.getId())
                    .username(username)
                    .build());
        }
    }
}
