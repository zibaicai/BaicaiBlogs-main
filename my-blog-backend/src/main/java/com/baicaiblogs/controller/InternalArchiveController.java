package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.ArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/archives")
@RequiredArgsConstructor
public class InternalArchiveController {

    private final ArchiveService archiveService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list() {
        try {
            return ApiResponse.success(archiveService.list(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> get(@PathVariable Long id) {
        try {
            return ApiResponse.success(archiveService.get(currentUser(), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/snapshot")
    public ResponseEntity<byte[]> snapshot(@PathVariable Long id) {
        try {
            String snapshot = archiveService.rawSnapshot(currentUser(), id);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .header("Content-Disposition", "attachment; filename=archive-" + id + ".html")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cache-Control", "private, no-store")
                    .body(snapshot.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable Long id, @RequestParam String url) {
        try {
            ArchiveService.ArchiveImage image = archiveService.fetchImage(currentUser(), id, url, false);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.contentType()))
                    .header("Content-Disposition", "inline")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cache-Control", "private, no-store")
                    .body(image.bytes());
        } catch (Exception e) {
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/preview/image")
    public ResponseEntity<byte[]> previewImage(@RequestParam String url) {
        try {
            ArchiveService.ArchiveImage image = archiveService.fetchImage(currentUser(), null, url, true);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.contentType()))
                    .header("Content-Disposition", "inline")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cache-Control", "private, no-store")
                    .body(image.bytes());
        } catch (Exception e) {
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/admins")
    public ApiResponse<List<Map<String, Object>>> admins() {
        try {
            return ApiResponse.success(archiveService.admins(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/preview")
    public ApiResponse<Map<String, Object>> preview(@RequestBody Map<String, String> body) {
        try {
            return ApiResponse.success(archiveService.preview(currentUser(), body.get("url")));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, String> body) {
        try {
            return ApiResponse.success("存档成功", archiveService.importDocument(currentUser(), body.get("url")));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/refresh")
    public ApiResponse<Map<String, Object>> refresh(@PathVariable Long id) {
        try {
            return ApiResponse.success("已重新抓取", archiveService.refresh(currentUser(), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PatchMapping("/{id}")
    public ApiResponse<Map<String, Object>> edit(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ApiResponse.success("已保存", archiveService.edit(currentUser(), id, body));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/grants")
    public ApiResponse<List<Map<String, Object>>> grants(@PathVariable Long id) {
        try {
            return ApiResponse.success(archiveService.grants(currentUser(), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/logs")
    public ApiResponse<List<Map<String, Object>>> logs(@PathVariable Long id) {
        try {
            return ApiResponse.success(archiveService.logs(currentUser(), id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/grants")
    public ApiResponse<Map<String, Object>> grant(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Number raw = (Number) body.get("adminUserId");
            if (raw == null) throw new RuntimeException("请选择管理员");
            return ApiResponse.success("授权成功", archiveService.grant(currentUser(), id, raw.longValue()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/grants/{adminUserId}")
    public ApiResponse<Void> revoke(@PathVariable Long id, @PathVariable Long adminUserId) {
        try {
            archiveService.revoke(currentUser(), id, adminUserId);
            return ApiResponse.success("已撤销授权", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            archiveService.delete(currentUser(), id);
            return ApiResponse.success("已删除", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/delete-request")
    public ApiResponse<Map<String, Object>> requestDelete(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body == null ? null : body.get("reason");
            return ApiResponse.success("删除申请已提交", archiveService.requestDelete(currentUser(), id, reason));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/delete-requests")
    public ApiResponse<List<Map<String, Object>>> deleteRequests() {
        try {
            return ApiResponse.success(archiveService.deleteRequests(currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/delete-requests/{requestId}/review")
    public ApiResponse<Void> reviewDelete(
            @PathVariable Long requestId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            boolean approve = body != null && Boolean.TRUE.equals(body.get("approve"));
            String note = body == null || body.get("note") == null ? null : String.valueOf(body.get("note"));
            archiveService.reviewDelete(currentUser(), requestId, approve, note);
            return ApiResponse.success(approve ? "已批准并删除" : "已拒绝", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("用户未登录");
    }
}
