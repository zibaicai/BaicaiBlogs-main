package com.baicaiblogs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private static final int ACCOUNT_LIMIT = 5;
    private static final int ACCOUNT_WINDOW_MINUTES = 10;
    private static final int ACCOUNT_LOCK_MINUTES = 15;
    private static final int IP_LIMIT = 20;
    private static final int IP_WINDOW_MINUTES = 10;
    private static final int IP_BAN_MINUTES = 30;

    private final IpBanService ipBanService;
    private final Map<String, Attempt> accounts = new ConcurrentHashMap<>();
    private final Map<String, Attempt> ips = new ConcurrentHashMap<>();

    public void assertAllowed(String ip, String username) {
        Attempt account = accounts.get(key(username));
        if (account != null && account.lockedUntil != null && account.lockedUntil.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("尝试次数过多，请稍后再试");
        }
        if (ip != null && ipBanService.isBanned(ip)) {
            throw new RuntimeException("当前 IP 已被临时封禁");
        }
    }

    public void failure(String ip, String username) {
        LocalDateTime now = LocalDateTime.now();
        Attempt account = bump(accounts, key(username), ACCOUNT_LIMIT, ACCOUNT_WINDOW_MINUTES,
                ACCOUNT_LOCK_MINUTES, now);
        if (account.lockedUntil != null && account.lockedUntil.isAfter(now)) {
            // Account lock is enough for now; continue to count the IP as well.
        }
        if (ip != null) {
            Attempt address = bump(ips, key(ip), IP_LIMIT, IP_WINDOW_MINUTES, 0, now);
            if (address.count >= IP_LIMIT) {
                ipBanService.banTemporary(ip, "登录失败次数过多", IP_BAN_MINUTES);
                ips.remove(key(ip));
            }
        }
    }

    public void success(String ip, String username) {
        if (username != null) accounts.remove(key(username));
        if (ip != null) ips.remove(key(ip));
    }

    private Attempt bump(Map<String, Attempt> map, String key, int limit, int windowMinutes,
                         int lockMinutes, LocalDateTime now) {
        Attempt attempt = map.computeIfAbsent(key, ignored -> new Attempt(now));
        synchronized (attempt) {
            if (attempt.windowStart.plusMinutes(windowMinutes).isBefore(now)) {
                attempt.count = 0;
                attempt.windowStart = now;
                attempt.lockedUntil = null;
            }
            attempt.count++;
            if (lockMinutes > 0 && attempt.count >= limit) {
                attempt.lockedUntil = now.plusMinutes(lockMinutes);
            }
        }
        return attempt;
    }

    private String key(String value) {
        return value == null ? "unknown" : value.trim().toLowerCase();
    }

    private static final class Attempt {
        private LocalDateTime windowStart;
        private LocalDateTime lockedUntil;
        private int count;

        private Attempt(LocalDateTime now) {
            this.windowStart = now;
        }
    }
}
