package com.baicaiblogs.service;

import com.baicaiblogs.entity.SiteConfig;
import com.baicaiblogs.entity.SiteMetric;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.entity.UserPresence;
import com.baicaiblogs.repository.SiteConfigRepository;
import com.baicaiblogs.repository.SiteMetricRepository;
import com.baicaiblogs.repository.UserPresenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final String TOTAL_PV = "total_pv";
    private static final LocalDateTime DEFAULT_UPTIME_START = LocalDateTime.of(2025, 12, 31, 0, 0);
    private static final int ONLINE_WINDOW_MINUTES = 3;

    private final UserPresenceRepository presenceRepository;
    private final SiteMetricRepository metricRepository;
    private final SiteConfigRepository siteConfigRepository;
    private final JdbcTemplate jdbcTemplate;
    private final OssService ossService;

    private volatile HealthSnapshot healthCache;
    private volatile long healthCacheAt = 0L;

    @Transactional
    public void recordVisit() {
        LocalDateTime now = LocalDateTime.now();
        if (metricRepository.increment(TOTAL_PV, now) == 0) {
            metricRepository.save(SiteMetric.builder()
                    .metricKey(TOTAL_PV)
                    .metricValue(1L)
                    .updatedAt(now)
                    .build());
        }
    }

    @Transactional
    public void heartbeat(User user, String path) {
        if (user == null) throw new RuntimeException("未登录");
        LocalDateTime now = LocalDateTime.now();
        UserPresence presence = presenceRepository.findById(user.getId())
                .orElseGet(() -> UserPresence.builder().userId(user.getId()).build());
        presence.setLastSeenAt(now);
        presence.setLastPath(path == null ? null : path.substring(0, Math.min(path.length(), 500)));
        presence.setUpdatedAt(now);
        presenceRepository.save(presence);
    }

    public Map<String, Object> snapshot() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime uptimeStart = uptimeStart();
        Duration uptime = Duration.between(uptimeStart, now);
        long uptimeDays = Math.max(0, uptime.toDays());
        long uptimeHours = Math.max(0, uptime.toHours() % 24);

        long totalPv = metricRepository.findById(TOTAL_PV)
                .map(SiteMetric::getMetricValue)
                .orElse(0L);
        long online = presenceRepository.countByLastSeenAtAfter(now.minusMinutes(ONLINE_WINDOW_MINUTES));

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> uptimeMap = new LinkedHashMap<>();
        uptimeMap.put("startAt", uptimeStart.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        uptimeMap.put("days", uptimeDays);
        uptimeMap.put("hours", uptimeHours);
        result.put("uptime", uptimeMap);

        Map<String, Object> visitsMap = new LinkedHashMap<>();
        visitsMap.put("total", totalPv);
        visitsMap.put("type", "PV");
        result.put("visits", visitsMap);

        Map<String, Object> onlineMap = new LinkedHashMap<>();
        onlineMap.put("count", online);
        onlineMap.put("windowSeconds", ONLINE_WINDOW_MINUTES * 60);
        result.put("online", onlineMap);

        result.put("health", health());
        result.put("updatedAt", now.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return result;
    }

    private LocalDateTime uptimeStart() {
        return siteConfigRepository.findByConfigKey("uptime_start_at")
                .map(SiteConfig::getConfigValue)
                .map(this::parseDate)
                .orElse(DEFAULT_UPTIME_START);
    }

    private LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) return DEFAULT_UPTIME_START;
        try {
            return LocalDateTime.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception ignored) {
            try {
                return OffsetDateTime.parse(value.trim()).toLocalDateTime();
            } catch (Exception ignoredAgain) {
                return DEFAULT_UPTIME_START;
            }
        }
    }

    private Map<String, Object> health() {
        long now = Instant.now().toEpochMilli();
        HealthSnapshot cached = healthCache;
        if (cached != null && now - healthCacheAt < 60_000) {
            return cached.toMap();
        }

        String database;
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            database = "ok";
        } catch (Exception e) {
            database = "error";
        }

        String storage = "error";
        try {
            storage = ossService.isHealthy() ? "ok" : "degraded";
        } catch (Exception e) {
            storage = "error";
        }

        String status = "ok";
        if ("error".equals(database) || "error".equals(storage)) status = "error";
        else if ("degraded".equals(storage)) status = "degraded";

        HealthSnapshot snapshot = new HealthSnapshot(status, database, storage, LocalDateTime.now());
        healthCache = snapshot;
        healthCacheAt = now;
        return snapshot.toMap();
    }

    private record HealthSnapshot(String status, String database, String storage, LocalDateTime checkedAt) {
        Map<String, Object> toMap() {
            Map<String, Object> checks = new LinkedHashMap<>();
            checks.put("api", "ok");
            checks.put("database", database);
            checks.put("storage", storage);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("status", status);
            result.put("checks", checks);
            result.put("checkedAt", checkedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            return result;
        }
    }
}
