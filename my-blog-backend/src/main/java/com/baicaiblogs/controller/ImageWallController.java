package com.baicaiblogs.controller;

import com.aliyun.oss.model.OSSObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.*;
import com.baicaiblogs.repository.*;
import com.baicaiblogs.service.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ImageWallController {

    private final ImageWallService imageWallService;
    private final AlbumAccessService albumAccessService;
    private final QuotaService quotaService;
    private final OssService ossService;
    private final WatermarkService watermarkService;
    private final ImageVariantService imageVariantService;
    private final AlbumRepository albumRepository;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final AppealRepository appealRepository;
    private final DeletionAuditRepository deletionAuditRepository;
    private final ObjectMapper objectMapper;
    private final IpBanService ipBanService;
    private final GrantService grantService;
    private final AuditService auditService;
    private final PasswordAttemptService passwordAttemptService;
    private final NotificationService notificationService;
    private final CommentRepository commentRepository;

    // ==================== 公开浏览 ====================

    @GetMapping("/public/gallery/albums")
    public ApiResponse<List<AlbumResponse>> publicAlbums(
            @RequestParam(defaultValue = "all") String visibility,
            @RequestParam(defaultValue = "all") String scope,
            HttpServletRequest request,
            HttpServletResponse response) {
        User user = imageWallService.currentUserOrNull();
        List<AlbumResponse> albums = imageWallService.listPublicAlbums(user, visibility);
        if ("mine".equalsIgnoreCase(scope)) {
            if (user == null) return ApiResponse.error("用户未登录");
            response.setHeader("Cache-Control", "private, no-store");
            response.setHeader("Vary", "Cookie");
            albums = albums.stream().filter(a -> Boolean.TRUE.equals(a.getIsOwner())).toList();
        }
        return ApiResponse.success(albums);
    }

    @GetMapping("/public/gallery/albums/{albumId}")
    public ApiResponse<AlbumResponse> publicAlbum(
            @PathVariable String albumId,
            @RequestParam(defaultValue = "all") String scope,
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            Album album = imageWallService.getAlbum(albumId);
            User user = imageWallService.currentUserOrNull();
            if ("mine".equalsIgnoreCase(scope)
                    && (user == null || album.getUserId() == null || !album.getUserId().equals(user.getId()))) {
                return ApiResponse.error("资源不存在");
            }
            boolean unlocked = isAlbumUnlocked(album, request);
            if (!imageWallService.canView(album, user, unlocked)) {
                if ("PASSWORD".equals(album.getVisibility()) && "VISIBLE".equals(album.getStatus())) {
                    return ApiResponse.success(imageWallService.toAlbum(album, false, user, false));
                }
                return ApiResponse.error("无权访问或资源不存在");
            }
            if (imageWallService.isSuperAdmin(user)
                    && !"PUBLIC".equals(album.getVisibility())
                    && (album.getUserId() == null || !album.getUserId().equals(user.getId()))) {
                String reason = request.getParameter("reason");
                auditService.internal(user, album, "detail", "super_admin", null,
                        reason == null || reason.isBlank() ? "super-admin-patrol" : reason, ipHash(request));
            }
            if ("mine".equalsIgnoreCase(scope)) {
                response.setHeader("Cache-Control", "private, no-store");
                response.setHeader("Vary", "Cookie");
            }
            return ApiResponse.success(imageWallService.albumDetail(album, true, unlocked));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/albums/{albumId}/cover-blur")
    public ResponseEntity<byte[]> coverBlur(@PathVariable String albumId) {
        try {
            Album album = imageWallService.getAlbum(albumId);
            if (!"PASSWORD".equals(album.getVisibility())
                    || album.getCoverBlurKey() == null || album.getCoverBlurKey().isBlank()) {
                return ResponseEntity.notFound().build();
            }
            byte[] bytes = ossService.getObjectBytes(album.getCoverBlurKey());
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .contentLength(bytes.length)
                    .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/public/gallery/albums/{albumId}/unlock")
    public ApiResponse<AlbumResponse> unlock(@PathVariable String albumId,
                                             @RequestBody ImageDtos.UnlockRequest body,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
        try {
            User user = imageWallService.currentUser();
            Album album = imageWallService.getAlbum(albumId);
            if (!"PASSWORD".equals(album.getVisibility())) {
                return ApiResponse.error("该相册不需要密码");
            }
            String ipHash = ipHash(request);
            try {
                passwordAttemptService.assertAllowed(album.getId(), user.getId(), ipHash);
            } catch (Exception e) {
                return ApiResponse.error(e.getMessage());
            }
            if (album.getPasswordHash() == null
                    || !passwordMatches(body.getPassword(), album.getPasswordHash())) {
                passwordAttemptService.fail(album.getId(), user.getId(), ipHash);
                return ApiResponse.error("密码错误，请重试");
            }
            passwordAttemptService.clear(album.getId(), user.getId(), ipHash);
            String token = albumAccessService.issue(album.getId(), user.getId());
            ResponseCookie cookie = ResponseCookie.from(AlbumAccessService.cookieName(album.getId()), token)
                    .httpOnly(true)
                    .secure(isSecure(request))
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(Duration.ofHours(2))
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ApiResponse.success(imageWallService.albumDetail(album, true, true));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/public/photos/{id}/thumb")
    public ResponseEntity<byte[]> thumb(@PathVariable Long id,
                                        @RequestParam(defaultValue = "normal") String view,
                                        HttpServletRequest request) {
        return privateImage(id, request, 400, view);
    }

    @GetMapping("/public/photos/{id}/standard")
    public ResponseEntity<byte[]> standard(@PathVariable Long id,
                                           @RequestParam(defaultValue = "normal") String view,
                                           HttpServletRequest request) {
        return privateImage(id, request, 800, view);
    }

    @GetMapping("/public/photos/{id}/original")
    public ResponseEntity<byte[]> original(@PathVariable Long id,
                                                          @RequestParam(defaultValue = "0") int download,
                                                          @RequestParam(required = false) String reason,
                                                          HttpServletRequest request) {
        User user = imageWallService.currentUserOrNull();
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Photo photo = imageWallService.getPhoto(id);
        Album album = photo.getAlbum();
        if ("ADMIN".equals(user.getRole()) && imageWallService.hasGrant(user, album)) {
            // grant 仅允许 400/800，绝不允许原图
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (!imageWallService.canViewOriginal(album, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        boolean superAdmin = imageWallService.isSuperAdmin(user);
        boolean sensitive = !"PUBLIC".equals(album.getVisibility());
        if (superAdmin && sensitive && (reason == null || reason.isBlank())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        boolean owner = album.getUserId() != null && album.getUserId().equals(user.getId());
        try {
            quotaService.authorizeOriginal(user, photo, owner);
            long bytes = photo.getBytes() == null ? 0 : photo.getBytes();
            quotaService.recordOriginal(user, photo, download == 1 ? "download" : "view", bytes, ipHash(request), owner);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        if (superAdmin) {
            auditService.internal(user, album, download == 1 ? "download" : "original",
                    "super_admin", null, reason, ipHash(request));
        }

        byte[] bytes = superAdmin
                ? ossService.getObjectBytes(photo.getObjectKey())
                : watermarkService.apply(photo.getObjectKey(), photo.getMime());
        MediaType mediaType = mediaTypeFor(photo.getMime());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(bytes.length)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(24)).cachePrivate())
                .header(HttpHeaders.CONTENT_DISPOSITION, download == 1 ? "attachment; filename=\"photo-" + id + ".jpg\"" : "inline")
                .body(bytes);
    }

    private ResponseEntity<byte[]> privateImage(Long id, HttpServletRequest request, int maxWidth, String view) {
        Photo photo = imageWallService.getPhoto(id);
        Album album = photo.getAlbum();
        User user = imageWallService.currentUserOrNull();
        boolean unlocked = isAlbumUnlocked(album, request);
        boolean grant = "grant".equalsIgnoreCase(view)
                && user != null && imageWallService.hasGrant(user, album);
        if (!imageWallService.canView(album, user, unlocked || grant)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (photo.getObjectKey() == null) {
            return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, photo.getUrl()).build();
        }

        boolean superAdmin = imageWallService.isSuperAdmin(user);
        Long watermarkAdminId = null;
        if (grant) {
            watermarkAdminId = user.getId();
            grantService.activeGrant(user.getId(), album.getId()).ifPresent(g ->
                    afterGrantView(album, user, g, maxWidth == 400 ? "view_thumb" : "view_standard", request));
        } else if (superAdmin && !"PUBLIC".equals(album.getVisibility())) {
            auditService.internal(user, album, maxWidth == 400 ? "thumb" : "standard",
                    "super_admin", null, "super-admin-patrol", ipHash(request));
        }

        byte[] original = ossService.getObjectBytes(photo.getObjectKey());
        byte[] bytes = imageVariantService.resize(original, maxWidth, photo.getMime(), watermarkAdminId);
        MediaType mediaType = mediaTypeFor(photo.getMime());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(bytes.length)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                .body(bytes);
    }

    private void afterGrantView(Album album, User admin, AlbumAccessGrant grant, String action, HttpServletRequest request) {
        auditService.internal(admin, album, action, "admin_grant", grant.getId(), grant.getReason(), ipHash(request));
        auditService.ownerVisible(album, admin, action, grant.getId());
        notificationService.notifyAdminView(album, admin, grant.getId());
    }

    // ==================== 用户相册/上传 ====================

    @GetMapping("/user/albums")
    public ApiResponse<List<AlbumResponse>> myAlbums() {
        try {
            return ApiResponse.success(imageWallService.listMyAlbums(imageWallService.currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/albums")
    public ApiResponse<AlbumResponse> createAlbum(@RequestBody AlbumRequest request) {
        try {
            User user = imageWallService.currentUser();
            Album album = imageWallService.createAlbum(request, user);
            return ApiResponse.success("创建成功", imageWallService.albumDetail(album, false));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/user/albums/{albumId}")
    public ApiResponse<AlbumResponse> updateAlbum(@PathVariable String albumId, @RequestBody AlbumRequest request) {
        try {
            User user = imageWallService.currentUser();
            Album album = imageWallService.getAlbum(albumId);
            imageWallService.updateAlbum(album, request, user);
            return ApiResponse.success("更新成功", imageWallService.albumDetail(album, false));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/user/albums/{albumId}")
    public ApiResponse<Void> deleteAlbum(@PathVariable String albumId) {
        try {
            User user = imageWallService.currentUser();
            imageWallService.deleteAlbum(imageWallService.getAlbum(albumId), user);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/albums/{albumId}/photos/presign")
    public ApiResponse<List<ImageDtos.PresignResponse>> presign(@PathVariable String albumId,
                                                                @RequestBody List<ImageDtos.PresignFile> files) {
        try {
            User user = imageWallService.currentUser();
            return ApiResponse.success(imageWallService.presign(imageWallService.getAlbum(albumId), files, user));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/albums/{albumId}/photos/confirm")
    public ApiResponse<List<PhotoResponse>> confirm(@PathVariable String albumId,
                                                    @RequestBody ImageDtos.ConfirmRequest request) {
        try {
            User user = imageWallService.currentUser();
            List<PhotoResponse> photos = imageWallService.confirm(
                    imageWallService.getAlbum(albumId), request.getPhotos(), user);
            return ApiResponse.success("上传成功", photos);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PatchMapping("/user/albums/{albumId}/photos/order")
    public ApiResponse<Void> reorder(@PathVariable String albumId, @RequestBody ImageDtos.ReorderRequest request) {
        try {
            User user = imageWallService.currentUser();
            imageWallService.reorder(imageWallService.getAlbum(albumId), request.getItems(), user);
            return ApiResponse.success("排序已保存", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/user/photos/{id}")
    public ApiResponse<Void> deletePhoto(@PathVariable Long id) {
        try {
            User user = imageWallService.currentUser();
            imageWallService.deletePhoto(imageWallService.getPhoto(id), user);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ==================== 举报/申诉 ====================

    @PostMapping("/public/photos/{id}/report")
    public ApiResponse<Void> reportPhoto(@PathVariable Long id, @RequestBody ImageDtos.ReportRequest request,
                                         HttpServletRequest httpRequest) {
        try {
            report("photo", id, request, httpRequest);
            return ApiResponse.success("举报已提交", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/public/gallery/albums/{albumId}/report")
    public ApiResponse<Void> reportAlbum(@PathVariable String albumId, @RequestBody ImageDtos.ReportRequest request,
                                         HttpServletRequest httpRequest) {
        try {
            Album album = imageWallService.getAlbum(albumId);
            report("album", album.getId(), request, httpRequest);
            return ApiResponse.success("举报已提交", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/public/photos/{id}/appeal")
    public ApiResponse<Void> appealPhoto(@PathVariable Long id, @RequestBody ImageDtos.AppealRequest request) {
        try {
            User user = imageWallService.currentUser();
            Photo photo = imageWallService.getPhoto(id);
            if (photo.getAlbum().getUserId() == null || !photo.getAlbum().getUserId().equals(user.getId())) {
                return ApiResponse.error("只能申诉自己的图片");
            }
            Appeal appeal = Appeal.builder()
                    .userId(user.getId())
                    .targetType("photo")
                    .targetId(id)
                    .reason(request.getReason())
                    .status("PENDING")
                    .build();
            appealRepository.save(appeal);
            return ApiResponse.success("申诉已提交", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ==================== 管理端 ====================

    @GetMapping("/admin/gallery/albums")
    public ApiResponse<List<AlbumResponse>> adminAlbums() {
        try {
            return ApiResponse.success(imageWallService.listMyAlbums(imageWallService.currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/reports")
    public ApiResponse<List<Report>> adminReports() {
        return ApiResponse.success(reportRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/admin/reports/{id}/resolve")
    public ApiResponse<Void> resolveReport(@PathVariable Long id, @RequestParam String action) {
        try {
            Report report = reportRepository.findById(id).orElseThrow(() -> new RuntimeException("举报不存在"));
            boolean restore = "restore".equalsIgnoreCase(action);
            report.setStatus(restore ? "RESTORED" : "HIDDEN");
            report.setHandledAt(java.time.LocalDateTime.now());
            reportRepository.save(report);

            if ("photo".equals(report.getTargetType())) {
                Photo photo = photoRepository.findById(report.getTargetId()).orElse(null);
                if (photo != null) {
                    photo.setStatus(restore ? "VISIBLE" : "HIDDEN");
                    if (restore) photo.setReportCount(0);
                    photoRepository.save(photo);
                }
            } else if ("album".equals(report.getTargetType())) {
                Album album = albumRepository.findById(report.getTargetId()).orElse(null);
                if (album != null) {
                    album.setStatus(restore ? "VISIBLE" : "HIDDEN");
                    if (restore) album.setReportCount(0);
                    albumRepository.save(album);
                }
            } else if ("comment".equalsIgnoreCase(report.getTargetType())) {
                commentRepository.findById(report.getTargetId()).ifPresent(comment -> {
                    comment.setStatus(restore ? "VISIBLE" : "HIDDEN");
                    commentRepository.save(comment);
                });
            }
            return ApiResponse.success("处理完成", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/ban")
    public ApiResponse<Void> banUser(@PathVariable Long id, @RequestParam(defaultValue = "违反社区规则") String reason) {
        try {
            User admin = imageWallService.currentUser();
            User target = userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
            if ("SUPER_ADMIN".equals(target.getRole()) && !imageWallService.isSuperAdmin(admin)) {
                return ApiResponse.error("无权封禁超级管理员");
            }
            target.setStatus("BANNED");
            target.setTokenVersion((target.getTokenVersion() == null ? 0 : target.getTokenVersion()) + 1);
            userRepository.save(target);
            return ApiResponse.success("已封禁", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/unban")
    public ApiResponse<Void> unbanUser(@PathVariable Long id) {
        try {
            User target = userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
            target.setStatus("ACTIVE");
            target.setTokenVersion((target.getTokenVersion() == null ? 0 : target.getTokenVersion()) + 1);
            userRepository.save(target);
            return ApiResponse.success("已解封", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /** 导出举报记录 ZIP（含举报人信息与证据图），仅超级管理员。 */
    @GetMapping("/admin/reports/export")
    public ResponseEntity<byte[]> exportReports(@RequestParam String ids) {
        User admin = imageWallService.currentUserOrNull();
        if (!imageWallService.isSuperAdmin(admin)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            String[] parts = ids.split(",");
            List<Map<String, Object>> rows = new ArrayList<>();
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ZipOutputStream zip = new ZipOutputStream(bos);
            for (String part : parts) {
                if (part.isBlank()) continue;
                Report report = reportRepository.findById(Long.parseLong(part.trim())).orElse(null);
                if (report == null) continue;
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("report", report);
                userRepository.findById(report.getReporterId()).ifPresent(u -> {
                    row.put("reporterUsername", u.getUsername());
                    row.put("reporterNickname", u.getNickname());
                });
                rows.add(row);
                if (report.getEvidenceKey() != null) {
                    try {
                        byte[] bytes = ossService.getObjectBytes(report.getEvidenceKey());
                        zip.putNextEntry(new ZipEntry("images/" + report.getId() + ".bin"));
                        zip.write(bytes);
                        zip.closeEntry();
                    } catch (Exception ignored) {
                    }
                }
            }
            zip.putNextEntry(new ZipEntry("reports.json"));
            zip.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(rows));
            zip.closeEntry();
            zip.close();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reports.zip\"")
                    .body(bos.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/admin/reports")
    public ApiResponse<Void> deleteReports(@RequestParam String ids,
                                           @RequestParam(defaultValue = "super-admin export then delete") String reason) {
        try {
            User admin = imageWallService.currentUser();
            if (!imageWallService.isSuperAdmin(admin)) {
                return ApiResponse.error("只有超级管理员可以删除举报记录");
            }
            String[] parts = ids.split(",");
            List<Long> deleted = new ArrayList<>();
            for (String part : parts) {
                if (part.isBlank()) continue;
                Long id = Long.parseLong(part.trim());
                reportRepository.findById(id).ifPresent(r -> {
                    if (r.getEvidenceKey() != null) ossService.deleteObject(r.getEvidenceKey());
                    reportRepository.delete(r);
                    deleted.add(id);
                });
            }
            deletionAuditRepository.save(DeletionAudit.builder()
                    .operatorId(admin.getId())
                    .reportIds(deleted.toString())
                    .reason(reason)
                    .build());
            return ApiResponse.success("已删除并保留最小审计", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/ip-bans")
    public ApiResponse<List<IpBan>> ipBans() {
        return ApiResponse.success(ipBanService.list());
    }

    @PostMapping("/admin/ip-bans")
    public ApiResponse<IpBan> banIp(@RequestParam String ip,
                                    @RequestParam(defaultValue = "违反社区规则") String reason) {
        try {
            User admin = imageWallService.currentUser();
            return ApiResponse.success("已封禁 IP", ipBanService.ban(ip, reason, admin.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/admin/ip-bans/{id}")
    public ApiResponse<Void> unbanIp(@PathVariable Long id) {
        ipBanService.unban(id);
        return ApiResponse.success("已解封", null);
    }

    @GetMapping("/admin/appeals")
    public ApiResponse<List<Appeal>> appeals() {
        return ApiResponse.success(appealRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/admin/appeals/{id}/handle")
    public ApiResponse<Void> handleAppeal(@PathVariable Long id, @RequestParam String action) {
        try {
            User admin = imageWallService.currentUser();
            Appeal appeal = appealRepository.findById(id).orElseThrow(() -> new RuntimeException("申诉不存在"));
            if (Boolean.TRUE.equals(appeal.getSuperLocked()) && !imageWallService.isSuperAdmin(admin)) {
                return ApiResponse.error("该申诉已由超级管理员接管，ADMIN 不能处理");
            }
            boolean accept = "accept".equalsIgnoreCase(action);
            appeal.setStatus(accept ? "ACCEPTED" : "REJECTED");
            appeal.setHandledBy(admin.getId());
            appeal.setHandledAt(java.time.LocalDateTime.now());
            appealRepository.save(appeal);
            if (accept) {
                if ("photo".equals(appeal.getTargetType())) {
                    photoRepository.findById(appeal.getTargetId()).ifPresent(p -> {
                        p.setStatus("VISIBLE");
                        p.setReportCount(0);
                        photoRepository.save(p);
                    });
                } else if ("album".equals(appeal.getTargetType())) {
                    albumRepository.findById(appeal.getTargetId()).ifPresent(a -> {
                        a.setStatus("VISIBLE");
                        a.setReportCount(0);
                        albumRepository.save(a);
                    });
                }
            }
            return ApiResponse.success("申诉处理完成", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/appeals/{id}/reopen")
    public ApiResponse<Void> reopenAppeal(@PathVariable Long id, @RequestParam(defaultValue = "管理组复核") String note) {
        try {
            User admin = imageWallService.currentUser();
            if (!imageWallService.isSuperAdmin(admin)) return ApiResponse.error("只有超级管理员可以翻案");
            Appeal appeal = appealRepository.findById(id).orElseThrow(() -> new RuntimeException("申诉不存在"));
            appeal.setStatus("SUPER_REOPENED");
            appeal.setSuperLocked(true);
            appeal.setSuperNote(note);
            appealRepository.save(appeal);
            return ApiResponse.success("已由超级管理员接管", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ==================== 授权 / 审计 / 通知 ====================

    @PostMapping("/admin/albums/{albumId}/access-requests")
    public ApiResponse<AlbumAccessRequest> requestAccess(@PathVariable String albumId,
                                                         @RequestBody ImageDtos.AccessRequest body) {
        try {
            User admin = imageWallService.currentUser();
            Album album = imageWallService.getAlbum(albumId);
            AlbumAccessRequest request = grantService.request(admin, album, body == null ? null : body.getReason());
            return ApiResponse.success("申请已提交，等待超级管理员审批", request);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/access-requests")
    public ApiResponse<List<AlbumAccessRequest>> accessRequests() {
        try {
            return ApiResponse.success(grantService.requests(imageWallService.currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/access-requests/{id}/approve")
    public ApiResponse<AlbumAccessGrant> approveAccess(@PathVariable Long id) {
        try {
            AlbumAccessGrant grant = grantService.approve(imageWallService.currentUser(), id);
            return ApiResponse.success("已批准，1 小时内有效", grant);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/admin/access-requests/{id}/reject")
    public ApiResponse<Void> rejectAccess(@PathVariable Long id) {
        try {
            grantService.reject(imageWallService.currentUser(), id);
            return ApiResponse.success("已拒绝", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/access-grants")
    public ApiResponse<List<AlbumAccessGrant>> accessGrants() {
        try {
            return ApiResponse.success(grantService.grants(imageWallService.currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/albums/{albumId}/access-logs")
    public ApiResponse<List<OwnerVisibleAccessLog>> ownerAccessLogs(@PathVariable String albumId) {
        try {
            User user = imageWallService.currentUser();
            Album album = imageWallService.getAlbum(albumId);
            imageWallService.assertOwner(album, user);
            return ApiResponse.success(auditService.ownerLogs(album.getId(), album.getUserId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/notifications")
    public ApiResponse<List<Notification>> notifications() {
        try {
            return ApiResponse.success(notificationService.list(imageWallService.currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/user/notifications/unread-count")
    public ApiResponse<Long> unreadNotifications() {
        try {
            return ApiResponse.success(notificationService.unread(imageWallService.currentUser()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/user/notifications/{id}/read")
    public ApiResponse<Void> readNotification(@PathVariable Long id) {
        try {
            notificationService.markRead(imageWallService.currentUser(), id);
            return ApiResponse.success("已读", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/reports/{id}/evidence")
    public ResponseEntity<byte[]> reportEvidence(@PathVariable Long id) {
        try {
            User user = imageWallService.currentUser();
            if (!imageWallService.isAdmin(user)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            Report report = reportRepository.findById(id).orElse(null);
            if (report == null || report.getEvidenceKey() == null) return ResponseEntity.notFound().build();
            byte[] bytes = ossService.getObjectBytes(report.getEvidenceKey());
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
                    .contentLength(bytes.length).cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin/audit")
    public ApiResponse<List<AlbumAccessLog>> internalAudit() {
        try {
            User user = imageWallService.currentUser();
            if (!imageWallService.isSuperAdmin(user)) return ApiResponse.error("只有超级管理员可以查看内部审计");
            return ApiResponse.success(auditService.allInternal());
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // ==================== helpers ====================

    private void report(String targetType, Long targetId, ImageDtos.ReportRequest request,
                        HttpServletRequest httpRequest) {
        User user = imageWallService.currentUser();
        if (quotaService.isNewUser(user)) {
            throw new RuntimeException("注册满 7 天后才能举报");
        }
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new RuntimeException("请选择举报理由");
        }
        Long targetOwnerId = targetUserId(targetType, targetId);
        if (targetOwnerId != null && targetOwnerId.equals(user.getId())) {
            throw new RuntimeException("不能举报自己的资源");
        }
        Report report = Report.builder()
                .reporterId(user.getId())
                .targetType(targetType)
                .targetId(targetId)
                .targetUserId(targetUserId(targetType, targetId))
                .reason(request.getReason())
                .detail(request.getDetail())
                .status("PENDING")
                .reporterIp(ipHash(httpRequest))
                .build();
        reportRepository.save(report);

        if ("photo".equals(targetType)) {
            Photo photo = imageWallService.getPhoto(targetId);
            photo.setReportCount((photo.getReportCount() == null ? 0 : photo.getReportCount()) + 1);
            if (photo.getReportCount() >= 10) photo.setStatus("HIDDEN");
            if (photo.getObjectKey() != null) {
                String evidence = "moderation/evidence/" + report.getId() + "/" + photo.getObjectKey();
                try {
                    ossService.copyObject(photo.getObjectKey(), evidence);
                    report.setEvidenceKey(evidence);
                } catch (Exception ignored) { }
            }
            photoRepository.save(photo);
        } else {
            Album album = albumRepository.findById(targetId).orElseThrow(() -> new RuntimeException("相册不存在"));
            album.setReportCount((album.getReportCount() == null ? 0 : album.getReportCount()) + 1);
            if (album.getReportCount() >= 10) album.setStatus("HIDDEN");
            albumRepository.save(album);
        }
        reportRepository.save(report);
    }

    private boolean isAlbumUnlocked(Album album, HttpServletRequest request) {
        if (request.getCookies() == null) return false;
        String token = Arrays.stream(request.getCookies())
                .filter(c -> AlbumAccessService.cookieName(album.getId()).equals(c.getName()))
                .map(Cookie::getValue).findFirst().orElse(null);
        return albumAccessService.valid(token, album.getId());
    }

    private boolean isSecure(HttpServletRequest request) {
        return "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")) || request.isSecure();
    }

    private String ipHash(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(md.digest(ip.getBytes(StandardCharsets.UTF_8))).substring(0, 32);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private MediaType mediaTypeFor(String mime) {
        if (mime == null) return MediaType.IMAGE_JPEG;
        if (mime.contains("png")) return MediaType.IMAGE_PNG;
        if (mime.contains("gif")) return MediaType.IMAGE_GIF;
        if (mime.contains("webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    private Long targetUserId(String targetType, Long targetId) {
        if ("photo".equals(targetType)) {
            Photo photo = photoRepository.findById(targetId).orElse(null);
            return photo == null ? null : photo.getAlbum().getUserId();
        }
        if ("album".equals(targetType)) {
            Album album = albumRepository.findById(targetId).orElse(null);
            return album == null ? null : album.getUserId();
        }
        return null;
    }

    private boolean passwordMatches(String raw, String hash) {
        return raw != null && org.springframework.security.crypto.bcrypt.BCrypt.checkpw(raw, hash);
    }
}
