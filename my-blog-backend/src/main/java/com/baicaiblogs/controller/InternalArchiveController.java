package com.baicaiblogs.controller;

import com.baicaiblogs.dto.ApiResponse;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.ArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{id}/grants")
    public ApiResponse<List<Map<String, Object>>> grants(@PathVariable Long id) {
        try {
            return ApiResponse.success(archiveService.grants(currentUser(), id));
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

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("用户未登录");
    }
}
