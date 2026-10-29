package com.baicaiblogs.service;

import com.baicaiblogs.entity.Friend;
import com.baicaiblogs.entity.FriendApplication;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.FriendApplicationRepository;
import com.baicaiblogs.repository.FriendRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FriendApplicationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final FriendApplicationRepository applicationRepository;
    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final TurnstileService turnstileService;

    @Transactional
    public Map<String, Object> submit(Map<String, String> body, String ip, String userAgent, User user) {
        turnstileService.verify(body.get("turnstileToken"), ip);
        String name = required(body.get("name"), "称谓", 100);
        String url = normalizeUrl(required(body.get("url"), "网站地址", 500));
        String avatar = optionalUrl(body.get("avatar"), 500);
        String description = optional(body.get("description"), 1000);
        String contact = optional(body.get("contact"), 500);
        boolean hasBacklink = "true".equalsIgnoreCase(body.get("hasBacklink"));
        String ipHash = ip == null || ip.isBlank() ? null : IpBanService.hash(ip);

        if (applicationRepository.existsByUrlAndStatusIn(url, List.of("PENDING", "APPROVED"))) {
            throw new RuntimeException("这个网站已经提交过了");
        }
        if (ipHash != null && applicationRepository.existsByIpHashAndStatus(ipHash, "PENDING")) {
            throw new RuntimeException("当前网络已经有一条待审核申请，请勿重复提交");
        }
        if (ipHash != null && applicationRepository.countByIpHashAndCreatedAtAfter(ipHash, LocalDateTime.now().minusDays(1)) >= 3) {
            throw new RuntimeException("今天提交次数过多，请明天再试");
        }

        String claimToken = newToken();
        FriendApplication application = FriendApplication.builder()
                .name(name)
                .url(url)
                .avatar(avatar)
                .description(description)
                .contact(contact)
                .hasBacklink(hasBacklink)
                .status("PENDING")
                .ipHash(ipHash)
                .userAgent(optional(userAgent, 500))
                .claimTokenHash(hash(claimToken))
                .boundUserId(user == null ? null : user.getId())
                .build();
        application = applicationRepository.save(application);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", application.getId());
        out.put("status", application.getStatus());
        out.put("claimToken", claimToken);
        out.put("bound", user != null);
        return out;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> pending() {
        return applicationRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(this::adminMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> approve(Long id, User reviewer) {
        FriendApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(application.getStatus())) throw new RuntimeException("该申请已处理");
        String friendId = "guest-" + application.getId();
        while (friendRepository.existsByFriendId(friendId)) friendId += "-x";
        Friend friend = friendRepository.save(Friend.builder()
                .friendId(friendId)
                .name(application.getName())
                .url(application.getUrl())
                .description(application.getDescription())
                .avatar(application.getAvatar())
                .sortOrder(friendRepository.findAllByOrderBySortOrderAsc().size())
                .build());
        application.setStatus("APPROVED");
        application.setFriendId(friend.getFriendId());
        application.setReviewedBy(reviewer.getId());
        application.setReviewedAt(LocalDateTime.now());
        applicationRepository.save(application);
        return adminMap(application);
    }

    @Transactional
    public void reject(Long id, User reviewer, String note) {
        FriendApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("申请不存在"));
        if (!"PENDING".equals(application.getStatus())) throw new RuntimeException("该申请已处理");
        application.setStatus("REJECTED");
        application.setReviewedBy(reviewer.getId());
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNote(optional(note, 1000));
        applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> mine(User user) {
        return applicationRepository.findFirstByBoundUserIdOrderByCreatedAtDesc(user.getId())
                .map(this::userMap)
                .orElse(null);
    }

    @Transactional
    public Map<String, Object> updateMine(User user, Map<String, String> body) {
        FriendApplication application = applicationRepository
                .findFirstByBoundUserIdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new RuntimeException("还没有绑定友链申请"));
        if (body.get("name") != null) application.setName(required(body.get("name"), "称谓", 100));
        if (body.get("avatar") != null) application.setAvatar(optionalUrl(body.get("avatar"), 500));
        if (body.get("description") != null) application.setDescription(optional(body.get("description"), 1000));
        if (body.get("contact") != null) application.setContact(optional(body.get("contact"), 500));
        if ("PENDING".equals(application.getStatus()) && body.get("url") != null) {
            application.setUrl(normalizeUrl(required(body.get("url"), "网站地址", 500)));
        }
        applicationRepository.save(application);
        if ("APPROVED".equals(application.getStatus()) && application.getFriendId() != null) {
            friendRepository.findByFriendId(application.getFriendId()).ifPresent(friend -> {
                friend.setName(application.getName());
                friend.setAvatar(application.getAvatar());
                friend.setDescription(application.getDescription());
                friendRepository.save(friend);
            });
        }
        return userMap(application);
    }

    @Transactional
    public Map<String, Object> bind(User user, String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new RuntimeException("绑定码为空");
        }
        FriendApplication application = applicationRepository
                .findFirstByClaimTokenHashAndBoundUserIdIsNull(hash(rawToken))
                .orElseThrow(() -> new RuntimeException("绑定码无效或已被使用"));
        application.setBoundUserId(user.getId());
        applicationRepository.save(application);
        return userMap(application);
    }

    private Map<String, Object> adminMap(FriendApplication application) {
        Map<String, Object> out = userMap(application);
        out.put("contact", application.getContact());
        out.put("hasBacklink", application.getHasBacklink());
        out.put("ipHash", application.getIpHash());
        out.put("userAgent", application.getUserAgent());
        out.put("createdAt", application.getCreatedAt());
        return out;
    }

    private Map<String, Object> userMap(FriendApplication application) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", application.getId());
        out.put("name", application.getName());
        out.put("url", application.getUrl());
        out.put("avatar", application.getAvatar());
        out.put("description", application.getDescription());
        out.put("contact", application.getContact());
        out.put("status", application.getStatus());
        out.put("friendId", application.getFriendId());
        out.put("bound", application.getBoundUserId() != null);
        return out;
    }

    private String required(String value, String label, int max) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) throw new RuntimeException(label + "不能为空");
        return optional(normalized, max);
    }

    private String optional(String value, int max) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isEmpty()) return null;
        return normalized.length() > max ? normalized.substring(0, max) : normalized;
    }

    private String optionalUrl(String value, int max) {
        String url = optional(value, max);
        if (url == null) return null;
        return normalizeUrl(url);
    }

    private String normalizeUrl(String value) {
        try {
            URI uri = URI.create(value.trim());
            if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new RuntimeException("网址只支持 http / https");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) throw new RuntimeException("网址格式不正确");
            String host = uri.getHost().toLowerCase();
            if (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("::1")
                    || host.startsWith("10.") || host.startsWith("192.168.")
                    || host.matches("172\\.(1[6-9]|2\\d|3[01])\\..*")) {
                throw new RuntimeException("不能填写内网地址");
            }
            return uri.toString();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("网址格式不正确");
        }
    }

    private String newToken() {
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception e) {
            throw new RuntimeException("无法生成校验值");
        }
    }
}
