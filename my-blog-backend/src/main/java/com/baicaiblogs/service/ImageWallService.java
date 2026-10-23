package com.baicaiblogs.service;

import com.aliyun.oss.model.ObjectMetadata;
import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.*;
import com.baicaiblogs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ImageWallService {

    private static final long MAX_UPLOAD = 10L * 1024 * 1024;
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final AlbumRepository albumRepository;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final OssService ossService;
    private final QuotaService quotaService;
    private final PasswordEncoder passwordEncoder;
    private final GrantService grantService;
    private final ImageVariantService imageVariantService;

    public User currentUser() {
        Object principal = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication() == null ? null
                : org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("请先登录");
    }

    public User currentUserOrNull() {
        try { return currentUser(); } catch (Exception e) { return null; }
    }

    public Album getAlbum(String albumId) {
        return albumRepository.findByAlbumId(albumId)
                .orElseThrow(() -> new RuntimeException("相册不存在"));
    }

    public Photo getPhoto(Long id) {
        return photoRepository.findById(id).orElseThrow(() -> new RuntimeException("图片不存在"));
    }

    public boolean isAdmin(User user) {
        return quotaService.isAdmin(user);
    }

    public boolean isSuperAdmin(User user) {
        return quotaService.isSuperAdmin(user);
    }

    public boolean hasGrant(User user, Album album) {
        return user != null && "ADMIN".equals(user.getRole())
                && grantService.activeGrant(user.getId(), album.getId()).isPresent();
    }

    public boolean canView(Album album, User user, boolean unlocked) {
        String status = album.getStatus() == null ? "VISIBLE" : album.getStatus();
        String visibility = album.getVisibility() == null ? "PUBLIC" : album.getVisibility();
        if ("VISIBLE".equals(status) && "PUBLIC".equals(visibility)) return true;
        if (user == null) return false;
        if (album.getUserId() != null && album.getUserId().equals(user.getId())) return true;
        if (isSuperAdmin(user)) return true;
        if (!"VISIBLE".equals(status)) return false;
        if ("PASSWORD".equals(visibility)) return unlocked || hasGrant(user, album);
        return false;
    }

    public boolean canViewOriginal(Album album, User user) {
        if (user == null) return false;
        if (album.getUserId() != null && album.getUserId().equals(user.getId())) return true;
        return isSuperAdmin(user);
    }

    public boolean isPublic(Album album) {
        String status = album.getStatus() == null ? "VISIBLE" : album.getStatus();
        String visibility = album.getVisibility() == null ? "PUBLIC" : album.getVisibility();
        return "VISIBLE".equals(status) && "PUBLIC".equals(visibility);
    }

    /**
     * C 端个性化目录：公开 + 密码锁定卡片 + 自己的私密；SUPER 可看全部私密。
     */
    public List<AlbumResponse> listPublicAlbums(User viewer, String filter) {
        String f = filter == null || filter.isBlank() ? "all" : filter.toLowerCase(Locale.ROOT);
        List<AlbumResponse> result = new ArrayList<>();
        for (Album album : albumRepository.findAllByOrderBySortOrderAsc()) {
            if (!"VISIBLE".equals(album.getStatus() == null ? "VISIBLE" : album.getStatus())) continue;
            String visibility = album.getVisibility() == null ? "PUBLIC" : album.getVisibility();
            boolean owner = viewer != null && album.getUserId() != null && album.getUserId().equals(viewer.getId());
            boolean superAdmin = isSuperAdmin(viewer);
            if ("PRIVATE".equals(visibility) && !owner && !superAdmin) continue;
            if ("public".equals(f) && !"PUBLIC".equals(visibility)) continue;
            if ("password".equals(f) && !"PASSWORD".equals(visibility)) continue;
            if ("private".equals(f) && !"PRIVATE".equals(visibility)) continue;
            result.add(toAlbum(album, false, viewer, false));
        }
        return result;
    }

    public List<AlbumResponse> listMyAlbums(User user) {
        List<Album> albums;
        if (isSuperAdmin(user)) {
            albums = albumRepository.findAllByOrderBySortOrderAsc();
        } else if ("ADMIN".equals(user.getRole())) {
            albums = albumRepository.findAllByOrderBySortOrderAsc().stream()
                    .filter(a -> !"PRIVATE".equals(a.getVisibility())
                            || (a.getUserId() != null && a.getUserId().equals(user.getId())))
                    .toList();
        } else {
            albums = albumRepository.findByUserIdOrderBySortOrderAsc(user.getId());
        }
        return albums.stream().map(a -> {
            boolean owner = a.getUserId() != null && a.getUserId().equals(user.getId());
            return toAlbum(a, false, user, owner);
        }).toList();
    }

    public AlbumResponse albumDetail(Album album, boolean includePhotos) {
        return albumDetail(album, includePhotos, false);
    }

    public AlbumResponse albumDetail(Album album, boolean includePhotos, boolean unlocked) {
        return toAlbum(album, includePhotos, currentUserOrNull(), unlocked);
    }

    /**
     * 统一构建相册响应：锁定密码相册不返回真实封面/照片；私密只允许 owner/SUPER。
     */
    public AlbumResponse toAlbum(Album album, boolean includePhotos, User viewer, boolean unlocked) {
        String visibility = album.getVisibility() == null ? "PUBLIC" : album.getVisibility();
        boolean owner = viewer != null && album.getUserId() != null && album.getUserId().equals(viewer.getId());
        boolean superAdmin = isSuperAdmin(viewer);
        boolean grantView = hasGrant(viewer, album);
        boolean canSeeContent = owner || superAdmin || grantView || unlocked || "PUBLIC".equals(visibility);
        boolean locked = "PASSWORD".equals(visibility) && !canSeeContent;

        List<Photo> photos = photoRepository.findByAlbumIdOrderByWeightDescSortOrderAscIdAsc(album.getId());
        List<Photo> visible = photos.stream()
                .filter(p -> "VISIBLE".equals(p.getStatus()))
                .toList();
        Photo cover = visible.isEmpty() ? null : visible.get(0);

        String blurUrl = null;
        if (locked && cover != null) {
            blurUrl = ensureBlurCover(album, cover);
        }

        List<PhotoResponse> photoResponses = includePhotos && canSeeContent
                ? visible.stream().map(p -> toPhoto(p, grantView)).toList()
                : List.of();

        Long photoCount = (long) visible.size();
        if (locked && Boolean.TRUE.equals(album.getHidePhotoCount())) photoCount = null;

        Long grantExpires = null;
        if (grantView) {
            grantExpires = grantService.activeGrant(viewer.getId(), album.getId())
                    .map(g -> g.getExpiresAt().atZone(ZONE).toEpochSecond()).orElse(null);
        }

        return AlbumResponse.builder()
                .id(album.getId())
                .albumId(album.getAlbumId())
                .userId(album.getUserId())
                .parentId(album.getParentId())
                .title(album.getTitle())
                .description(locked ? null : album.getDescription())
                .cover(canSeeContent ? album.getCover() : null)
                .date(album.getDate())
                .sortOrder(album.getSortOrder())
                .visibility(visibility)
                .hasPassword(album.getPasswordHash() != null && !album.getPasswordHash().isBlank())
                .status(album.getStatus())
                .reportCount(album.getReportCount())
                .photoCount(photoCount)
                .coverThumbUrl(canSeeContent && cover != null ? toPhoto(cover, grantView).getThumbUrl() : null)
                .coverStandardUrl(canSeeContent && cover != null ? toPhoto(cover, grantView).getStandardUrl() : null)
                .coverBlurUrl(blurUrl)
                .locked(locked)
                .isOwner(owner)
                .hidePhotoCount(Boolean.TRUE.equals(album.getHidePhotoCount()))
                .ownerLabel(superAdmin && !owner && album.getUserId() != null ? "用户 #" + album.getUserId() : null)
                .contentVersion(album.getContentVersion())
                .grantExpiresAt(grantExpires)
                .photos(photoResponses)
                .build();
    }

    private String ensureBlurCover(Album album, Photo cover) {
        if (album.getCoverBlurKey() != null && !album.getCoverBlurKey().isBlank()) {
            return "/api/public/albums/" + album.getAlbumId() + "/cover-blur";
        }
        if (cover.getObjectKey() == null) return null;
        try {
            byte[] original = ossService.getObjectBytes(cover.getObjectKey());
            byte[] blurred = imageVariantService.blur(original);
            String key = "photos/" + album.getAlbumId() + "/cover-blur.jpg";
            ossService.putObject(key, blurred, "image/jpeg");
            album.setCoverBlurKey(key);
            albumRepository.save(album);
            return "/api/public/albums/" + album.getAlbumId() + "/cover-blur";
        } catch (Exception e) {
            return null;
        }
    }

    public PhotoResponse toPhoto(Photo photo, boolean grantView) {
        String key = photo.getObjectKey();
        String suffix = grantView ? "?view=grant" : "";
        String thumb = key == null ? photo.getUrl() : "/api/public/photos/" + photo.getId() + "/thumb" + suffix;
        String standard = key == null ? photo.getUrl() : "/api/public/photos/" + photo.getId() + "/standard" + suffix;
        return PhotoResponse.builder()
                .id(photo.getId())
                .albumId(photo.getAlbum().getId())
                .url(photo.getUrl())
                .thumbUrl(thumb)
                .standardUrl(standard)
                .originalUrl(grantView ? null : "/api/public/photos/" + photo.getId() + "/original")
                .caption(photo.getCaption())
                .weight(photo.getWeight())
                .width(photo.getWidth())
                .height(photo.getHeight())
                .bytes(photo.getBytes())
                .mime(photo.getMime())
                .status(photo.getStatus())
                .reportCount(photo.getReportCount())
                .createdAt(photo.getCreatedAt())
                .build();
    }

    @Transactional
    public Album createAlbum(AlbumRequest request, User user) {
        quotaService.assertUploadUnlocked(user);
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("相册名称不能为空");
        }
        String visibility = normalizeVisibility(request.getVisibility());
        String password = request.getPassword();
        if ("PASSWORD".equals(visibility) && (password == null || password.isBlank())) {
            throw new RuntimeException("密码相册必须设置密码");
        }
        String albumId = request.getAlbumId();
        if (albumId == null || albumId.isBlank()) {
            albumId = "album_" + System.currentTimeMillis();
        }
        Album album = Album.builder()
                .albumId(albumId)
                .userId(user.getId())
                .parentId(request.getParentId())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .cover(request.getCover())
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .visibility(visibility)
                .passwordHash(password == null || password.isBlank() ? null : passwordEncoder.encode(password))
                .hidePhotoCount(Boolean.TRUE.equals(request.getHidePhotoCount()))
                .status("VISIBLE")
                .contentVersion(0L)
                .build();
        return albumRepository.save(album);
    }

    @Transactional
    public Album updateAlbum(Album album, AlbumRequest request, User user) {
        assertOwner(album, user);
        String oldVisibility = album.getVisibility();
        String oldPassword = album.getPasswordHash();
        if (request.getTitle() != null) album.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) album.setDescription(request.getDescription());
        if (request.getSortOrder() != null) album.setSortOrder(request.getSortOrder());
        if (request.getParentId() != null) album.setParentId(request.getParentId());
        if (request.getHidePhotoCount() != null) album.setHidePhotoCount(request.getHidePhotoCount());
        if (request.getCover() != null) {
            album.setCover(request.getCover());
            album.setCoverBlurKey(null);
        }
        if (request.getVisibility() != null && !request.getVisibility().isBlank()) {
            String visibility = normalizeVisibility(request.getVisibility());
            album.setVisibility(visibility);
            if (!"PASSWORD".equals(visibility)) album.setPasswordHash(null);
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            album.setVisibility("PASSWORD");
            album.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        boolean visibilityChanged = !Objects.equals(oldVisibility, album.getVisibility());
        boolean securityChanged = visibilityChanged || !Objects.equals(oldPassword, album.getPasswordHash());
        if (securityChanged) grantService.revokeForAlbum(album.getId());
        if (visibilityChanged && !"PASSWORD".equals(album.getVisibility()) && album.getCoverBlurKey() != null) {
            ossService.deleteObject(album.getCoverBlurKey());
            album.setCoverBlurKey(null);
        }
        album.setContentVersion((album.getContentVersion() == null ? 0 : album.getContentVersion()) + 1);
        return albumRepository.save(album);
    }

    private String normalizeVisibility(String value) {
        String v = value == null ? "PUBLIC" : value.toUpperCase(Locale.ROOT);
        if (!List.of("PUBLIC", "PASSWORD", "PRIVATE").contains(v)) {
            throw new RuntimeException("不支持的可见性");
        }
        return v;
    }

    public void assertOwner(Album album, User user) {
        if (isSuperAdmin(user)) return;
        if (album.getUserId() == null || !album.getUserId().equals(user.getId())) {
            throw new RuntimeException("无权操作该相册");
        }
    }

    public void deleteAlbum(Album album, User user) {
        assertOwner(album, user);
        grantService.revokeForAlbum(album.getId());
        List<Photo> photos = photoRepository.findByAlbumIdOrderByWeightDescSortOrderAscIdAsc(album.getId());
        for (Photo p : photos) {
            if (p.getObjectKey() != null) ossService.deleteObject(p.getObjectKey());
            if (!isAdmin(user) && album.getUserId() != null) {
                quotaService.releaseStorage(user, p.getBytes() == null ? 0 : p.getBytes());
            }
        }
        if (album.getCoverBlurKey() != null) ossService.deleteObject(album.getCoverBlurKey());
        albumRepository.delete(album);
    }

    public List<ImageDtos.PresignResponse> presign(Album album, List<ImageDtos.PresignFile> files, User user) {
        assertOwner(album, user);
        quotaService.assertUploadUnlocked(user);
        if (files == null || files.isEmpty()) throw new RuntimeException("请选择图片");
        if (files.size() > 10) throw new RuntimeException("单次最多上传 10 张");

        long todayCount = photoRepository.countByUserAndCreatedAtBetween(
                user.getId(), LocalDate.now(ZONE).atStartOfDay(), LocalDate.now(ZONE).plusDays(1).atStartOfDay());
        if (!isAdmin(user) && todayCount + files.size() > QuotaService.DAILY_UPLOAD_LIMIT) {
            throw new RuntimeException("今日上传额度已用完（公开+私密合计 10 张）");
        }

        List<ImageDtos.PresignResponse> result = new ArrayList<>();
        long total = 0;
        for (ImageDtos.PresignFile file : files) {
            if (file.getSize() == null || file.getSize() <= 0) throw new RuntimeException("文件大小无效");
            if (file.getSize() > MAX_UPLOAD) throw new RuntimeException("单张图片不能超过 10MB");
            if (file.getType() == null || !file.getType().startsWith("image/") || file.getType().contains("svg")) {
                throw new RuntimeException("仅支持 JPG/PNG/WebP/AVIF/GIF");
            }
            total += file.getSize();
            String ext = extension(file.getName(), file.getType());
            String key = "photos/" + album.getAlbumId() + "/" + LocalDate.now(ZONE) + "/"
                    + UUID.randomUUID().toString().replace("-", "") + ext;
            long exp = System.currentTimeMillis() + 10 * 60 * 1000;
            String uploadUrl = ossService.presignPut(key, file.getType(), new Date(exp));
            result.add(new ImageDtos.PresignResponse() {{
                setKey(key);
                setUploadUrl(uploadUrl);
                setPublicUrl(ossService.publicUrl(key));
                setExpiresAt(exp);
            }});
        }
        quotaService.assertStorage(user, total);
        return result;
    }

    @Transactional
    public List<PhotoResponse> confirm(Album album, List<ImageDtos.ConfirmPhoto> items, User user) {
        assertOwner(album, user);
        quotaService.assertUploadUnlocked(user);
        if (items == null || items.isEmpty()) throw new RuntimeException("没有待确认的图片");
        List<Photo> photos = photoRepository.findByAlbumIdOrderByWeightDescSortOrderAscIdAsc(album.getId());
        int minWeight = photos.stream().map(Photo::getWeight).filter(Objects::nonNull).min(Integer::compareTo).orElse(0);
        List<PhotoResponse> result = new ArrayList<>();
        long added = 0;
        for (ImageDtos.ConfirmPhoto item : items) {
            String key = item.getKey();
            if (key == null || !key.startsWith("photos/" + album.getAlbumId() + "/")) {
                throw new RuntimeException("非法的图片路径");
            }
            ObjectMetadata meta = ossService.headObject(key);
            if (meta == null) throw new RuntimeException("图片尚未上传完成");
            long size = meta.getContentLength();
            if (size <= 0 || size > MAX_UPLOAD) throw new RuntimeException("图片大小超过 10MB");
            String mime = meta.getContentType() == null ? item.getMime() : meta.getContentType();
            if (mime == null || !mime.startsWith("image/") || mime.contains("svg")) {
                throw new RuntimeException("不支持的图片类型");
            }
            minWeight -= 10;
            Photo photo = Photo.builder()
                    .album(album)
                    .objectKey(key)
                    .url(ossService.publicUrl(key))
                    .caption(item.getCaption())
                    .weight(item.getWeight() != null ? item.getWeight() : minWeight)
                    .width(item.getWidth())
                    .height(item.getHeight())
                    .bytes(size)
                    .mime(mime)
                    .hash(item.getHash())
                    .status("VISIBLE")
                    .build();
            photoRepository.save(photo);
            added += size;
            result.add(toPhoto(photo, false));
        }
        album.setContentVersion((album.getContentVersion() == null ? 0 : album.getContentVersion()) + 1);
        album.setCoverBlurKey(null);
        albumRepository.save(album);
        quotaService.assertStorage(user, added);
        quotaService.addStorage(user, added);
        return result;
    }

    @Transactional
    public void reorder(Album album, List<ImageDtos.ReorderItem> items, User user) {
        assertOwner(album, user);
        if (items == null) return;
        List<Photo> photos = photoRepository.findByAlbumIdOrderByWeightDescSortOrderAscIdAsc(album.getId());
        Map<Long, Photo> map = new HashMap<>();
        photos.forEach(p -> map.put(p.getId(), p));
        for (ImageDtos.ReorderItem item : items) {
            Photo p = map.get(item.getPhotoId());
            if (p != null) p.setWeight(item.getWeight() == null ? p.getWeight() : item.getWeight());
        }
        photoRepository.saveAll(photos);
        album.setContentVersion((album.getContentVersion() == null ? 0 : album.getContentVersion()) + 1);
        album.setCoverBlurKey(null);
        albumRepository.save(album);
    }

    @Transactional
    public void deletePhoto(Photo photo, User user) {
        Album album = photo.getAlbum();
        assertOwner(album, user);
        long bytes = photo.getBytes() == null ? 0 : photo.getBytes();
        photoRepository.delete(photo);
        if (!isAdmin(user)) quotaService.releaseStorage(user, bytes);
        if (photo.getObjectKey() != null) ossService.deleteObject(photo.getObjectKey());
        album.setContentVersion((album.getContentVersion() == null ? 0 : album.getContentVersion()) + 1);
        album.setCoverBlurKey(null);
        albumRepository.save(album);
    }

    public List<PhotoResponse> photos(Album album, boolean publicView) {
        return photoRepository.findByAlbumIdOrderByWeightDescSortOrderAscIdAsc(album.getId()).stream()
                .filter(p -> "VISIBLE".equals(p.getStatus()))
                .map(p -> toPhoto(p, false))
                .toList();
    }

    private String extension(String name, String mime) {
        if (name != null && name.contains(".")) {
            String ext = name.substring(name.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (ext.matches("\\.[a-z0-9]{1,5}")) return ext;
        }
        if (mime.contains("png")) return ".png";
        if (mime.contains("webp")) return ".webp";
        if (mime.contains("gif")) return ".gif";
        if (mime.contains("avif")) return ".avif";
        return ".jpg";
    }
}
