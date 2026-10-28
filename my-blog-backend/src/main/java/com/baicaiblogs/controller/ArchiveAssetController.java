package com.baicaiblogs.controller;

import com.baicaiblogs.entity.User;
import com.baicaiblogs.service.ArchiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/archive-assets")
@RequiredArgsConstructor
public class ArchiveAssetController {

    private final ArchiveService archiveService;

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        try {
            ArchiveService.ArchiveAssetData asset = archiveService.getAsset(currentUser(), id);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(asset.contentType()))
                    .header("Content-Disposition", "inline")
                    .header("X-Content-Type-Options", "nosniff")
                    .header("Cache-Control", "private, no-store")
                    .body(asset.bytes());
        } catch (Exception e) {
            return ResponseEntity.status(403).build();
        }
    }

    private User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("用户未登录");
    }
}
