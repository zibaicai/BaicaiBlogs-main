package com.baicaiblogs.service;

import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminOverviewService {

    private final JdbcTemplate jdbcTemplate;
    private final DashboardService dashboardService;

    public Map<String, Object> snapshot(User user) {
        Long userId = user == null ? null : user.getId();

        Map<String, Object> assets = new LinkedHashMap<>();
        assets.put("posts", count("SELECT COUNT(*) FROM posts WHERE user_id = ?", userId));
        assets.put("published", count("SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'PUBLISHED' AND visibility = 'public'", userId));
        assets.put("drafts", count("SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'DRAFT'", userId));
        assets.put("private", count("SELECT COUNT(*) FROM posts WHERE user_id = ? AND visibility = 'private'", userId));
        assets.put("projects", count("SELECT COUNT(*) FROM projects WHERE user_id = ?", userId));
        assets.put("moments", count("SELECT COUNT(*) FROM moments WHERE user_id = ?", userId));
        assets.put("albums", count("SELECT COUNT(*) FROM albums WHERE user_id = ?", userId));
        assets.put("photos", count("SELECT COUNT(*) FROM photos p JOIN albums a ON p.album_id = a.id WHERE a.user_id = ?", userId));
        assets.put("tags", count("SELECT COUNT(*) FROM tags"));
        assets.put("categories", count("SELECT COUNT(*) FROM categories"));

        long storageUsed = count("SELECT COALESCE(SUM(storage_used), 0) FROM users WHERE id = ?", userId);
        long storageQuota = count("SELECT COALESCE(SUM(quota_bytes), 0) FROM users WHERE id = ?", userId);
        if (storageQuota <= 0) storageQuota = 1_073_741_824L;
        Map<String, Object> storage = new LinkedHashMap<>();
        storage.put("usedBytes", storageUsed);
        storage.put("quotaBytes", storageQuota);
        storage.put("usagePercent", storageQuota <= 0 ? 0 : Math.min(100, Math.round(storageUsed * 100.0 / storageQuota)));

        Map<String, Object> pending = new LinkedHashMap<>();
        pending.put("reports", count("SELECT COUNT(*) FROM reports WHERE status = 'PENDING'"));
        pending.put("tagRequests", count("SELECT COUNT(*) FROM tags WHERE status = 'PENDING'"));
        pending.put("albumAccessRequests", count("SELECT COUNT(*) FROM album_access_requests WHERE status = 'PENDING'"));
        pending.put("comments", count("SELECT COUNT(*) FROM comments WHERE status = 'PENDING'"));
        pending.put("drafts", assets.get("drafts"));

        Map<String, Object> engagement = new LinkedHashMap<>();
        engagement.put("comments", count("SELECT COUNT(*) FROM comments"));
        engagement.put("danmaku", count("SELECT COUNT(*) FROM danmaku_messages"));

        Map<String, Object> dashboard = dashboardService.snapshot();
        engagement.put("totalPv", nested(dashboard, "visits", "total"));
        engagement.put("online", nested(dashboard, "online", "count"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assets", assets);
        result.put("storage", storage);
        result.put("pending", pending);
        result.put("engagement", engagement);
        result.put("health", dashboard.get("health"));
        result.put("activity", activity(userId));
        result.put("updatedAt", dashboard.get("updatedAt"));
        return result;
    }

    private long count(String sql, Object... args) {
        try {
            Long value = jdbcTemplate.queryForObject(sql, Long.class, args);
            return value == null ? 0 : value;
        } catch (Exception ignored) {
            return 0;
        }
    }

    private Object nested(Map<String, Object> source, String key, String child) {
        Object value = source.get(key);
        if (value instanceof Map<?, ?> map) return map.get(child);
        return 0;
    }

    private List<Map<String, Object>> activity(Long userId) {
        List<Map<String, Object>> result = new ArrayList<>();
        try {
            LocalDate from = LocalDate.now().minusDays(6);
            jdbcTemplate.query(
                    "SELECT DATE(date) d, COUNT(*) c FROM posts WHERE user_id = ? AND date >= ? GROUP BY DATE(date) ORDER BY d",
                    rs -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("date", String.valueOf(rs.getDate("d")));
                        row.put("posts", rs.getLong("c"));
                        result.add(row);
                    },
                    userId, from
            );
        } catch (Exception ignored) {
            // Activity is optional; never block the overview.
        }
        return result;
    }
}
