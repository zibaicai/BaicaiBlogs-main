package com.baicaiblogs.service;

import com.baicaiblogs.entity.ArchiveAccessLog;
import com.baicaiblogs.entity.ArchiveDeleteRequest;
import com.baicaiblogs.entity.ArchiveDocument;
import com.baicaiblogs.entity.ArchiveGrant;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.ArchiveAccessLogRepository;
import com.baicaiblogs.repository.ArchiveDeleteRequestRepository;
import com.baicaiblogs.repository.ArchiveDocumentRepository;
import com.baicaiblogs.repository.ArchiveGrantRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ArchiveService {

    private static final int MAX_HTML_BYTES = 2 * 1024 * 1024;
    private static final int MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    private static final long MAX_IMAGE_PIXELS = 40_000_000L;
    private static final int MAX_GIF_FRAMES = 300;
    private static final int MAX_REDIRECTS = 3;
    private static final Pattern LANGUAGE_CLASS = Pattern.compile("language-[a-zA-Z0-9+#._-]{1,30}");

    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowElements("p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
                    "ul", "ol", "li", "blockquote", "pre", "code",
                    "strong", "em", "del", "a", "img", "figure", "figcaption",
                    "table", "thead", "tbody", "tr", "th", "td", "hr", "sup", "sub")
            .allowAttributes("href").onElements("a")
            .allowAttributes("src", "alt", "title", "width", "height").onElements("img")
            .allowAttributes("class").matching(LANGUAGE_CLASS).onElements("code", "pre")
            .allowUrlProtocols("http", "https", "mailto")
            .requireRelNofollowOnLinks()
            .toFactory();

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    private final ArchiveDocumentRepository documentRepository;
    private final ArchiveGrantRepository grantRepository;
    private final ArchiveAccessLogRepository accessLogRepository;
    private final ArchiveDeleteRequestRepository deleteRequestRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(User actor) {
        requireAdmin(actor);
        List<ArchiveDocument> documents;
        if (isSuper(actor)) {
            documents = documentRepository.findAllByOrderByImportedAtDesc();
        } else {
            List<Long> ids = grantRepository.findByAdminUserIdAndRevokedAtIsNull(actor.getId()).stream()
                    .filter(this::grantActive)
                    .map(ArchiveGrant::getArchiveId)
                    .toList();
            documents = documentRepository.findAllById(ids).stream()
                    .sorted(Comparator.comparing(ArchiveDocument::getImportedAt).reversed())
                    .toList();
        }
        return documents.stream().map(doc -> toMap(doc, false)).toList();
    }

    @Transactional
    public Map<String, Object> get(User actor, Long id) {
        ArchiveDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("存档不存在"));
        requireRead(actor, doc.getId());
        log(doc.getId(), actor, "VIEW", null);
        return toMap(doc, true);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> logs(User actor, Long archiveId) {
        requireSuper(actor);
        documentRepository.findById(archiveId).orElseThrow(() -> new RuntimeException("存档不存在"));
        return accessLogRepository.findTop100ByArchiveIdOrderByCreatedAtDesc(archiveId).stream().map(log -> {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", log.getId());
            out.put("action", log.getAction());
            out.put("userId", log.getUserId());
            out.put("ipHash", log.getIpHash());
            out.put("userAgent", log.getUserAgent());
            out.put("detail", log.getDetail());
            out.put("createdAt", log.getCreatedAt());
            userRepository.findById(log.getUserId()).ifPresent(user -> out.put("username", user.getUsername()));
            return out;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> admins(User actor) {
        requireSuper(actor);
        return userRepository.findAll().stream()
                .filter(user -> "ADMIN".equals(user.getRole()) && !"BANNED".equalsIgnoreCase(user.getStatus()))
                .map(user -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", user.getId());
                    item.put("username", user.getUsername());
                    item.put("nickname", user.getNickname());
                    return item;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> grants(User actor, Long archiveId) {
        requireSuper(actor);
        return grantRepository.findByArchiveIdAndRevokedAtIsNull(archiveId).stream().map(grant -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", grant.getId());
            item.put("adminUserId", grant.getAdminUserId());
            item.put("expiresAt", grant.getExpiresAt());
            userRepository.findById(grant.getAdminUserId()).ifPresent(user -> {
                item.put("username", user.getUsername());
                item.put("nickname", user.getNickname());
            });
            return item;
        }).toList();
    }

    public Map<String, Object> preview(User actor, String rawUrl) {
        requireSuper(actor);
        return toMap(fetch(rawUrl), true);
    }

    @Transactional(readOnly = true)
    public String rawSnapshot(User actor, Long archiveId) {
        requireSuper(actor);
        ArchiveDocument doc = documentRepository.findById(archiveId)
                .orElseThrow(() -> new RuntimeException("存档不存在"));
        if (doc.getRawSnapshot() == null || doc.getRawSnapshot().isBlank()) {
            throw new RuntimeException("该存档没有原始快照");
        }
        return doc.getRawSnapshot();
    }

    public ArchiveImage fetchImage(User actor, Long archiveId, String rawUrl, boolean preview) {
        if (preview) {
            requireSuper(actor);
        } else {
            requireRead(actor, archiveId);
        }
        URI uri = validateUrl(rawUrl);
        try {
            URI current = uri;
            HttpResponse<byte[]> response = null;
            for (int i = 0; i <= MAX_REDIRECTS; i++) {
                HttpRequest request = HttpRequest.newBuilder(current)
                        .timeout(Duration.ofSeconds(10))
                        .header("User-Agent", "BaicaiArchiveImage/1.0 (+https://www.zibaicai.cn)")
                        .header("Accept", "image/jpeg,image/png,image/webp,image/gif")
                        .GET()
                        .build();
                response = HTTP.send(request, HttpResponse.BodyHandlers.ofByteArray());
                int status = response.statusCode();
                if (status >= 300 && status < 400) {
                    String location = response.headers().firstValue("Location").orElse(null);
                    if (location == null || location.isBlank()) throw new RuntimeException("图片重定向无效");
                    current = validateUrl(current.resolve(location).toString());
                    continue;
                }
                if (status != 200) throw new RuntimeException("图片获取失败，HTTP " + status);
                break;
            }
            if (response == null) throw new RuntimeException("图片获取失败");
            byte[] bytes = response.body();
            if (bytes == null || bytes.length == 0) throw new RuntimeException("图片内容为空");
            if (bytes.length > MAX_IMAGE_BYTES) throw new RuntimeException("图片超过 10MB 限制");
            String contentType = detectImageType(bytes);
            if (contentType == null) throw new RuntimeException("仅支持 JPEG / PNG / WebP / GIF 图片");
            validateImageDimensions(bytes);
            return new ArchiveImage(bytes, contentType);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("图片抓取失败：" + e.getMessage());
        }
    }

    @Transactional
    public Map<String, Object> importDocument(User actor, String rawUrl) {
        requireSuper(actor);
        Fetched fetched = fetch(rawUrl);
        ArchiveDocument existing = documentRepository.findBySourceUrlHash(fetched.sourceUrlHash()).orElse(null);
        if (existing != null) {
            return toMap(existing, true);
        }

        ArchiveDocument doc = ArchiveDocument.builder()
                .sourceUrl(fetched.sourceUrl())
                .canonicalUrl(fetched.canonicalUrl())
                .sourceUrlHash(fetched.sourceUrlHash())
                .sourceTitle(fetched.title())
                .sourceAuthor(fetched.author())
                .sourceSite(fetched.site())
                .sourcePublishedAt(fetched.publishedAt())
                .importedAt(LocalDateTime.now())
                .importedBy(actor.getId())
                .contentHtml(fetched.html())
                .rawSnapshot(fetched.rawSnapshot())
                .contentHash(fetched.contentHash())
                .copyrightNote("版权归原作者所有，仅限内部存档查阅，请勿外传。")
                .status("ACTIVE")
                .build();
        doc = documentRepository.save(doc);
        log(doc.getId(), actor, "IMPORT", fetched.sourceUrl());
        return toMap(doc, true);
    }

    @Transactional
    public Map<String, Object> grant(User actor, Long archiveId, Long adminUserId) {
        requireSuper(actor);
        documentRepository.findById(archiveId).orElseThrow(() -> new RuntimeException("存档不存在"));
        User target = userRepository.findById(adminUserId).orElseThrow(() -> new RuntimeException("管理员不存在"));
        if (!"ADMIN".equals(target.getRole())) {
            throw new RuntimeException("只能授权给 ADMIN 角色");
        }
        if ("BANNED".equalsIgnoreCase(target.getStatus())) {
            throw new RuntimeException("该账号已被封禁");
        }

        ArchiveGrant grant = grantRepository
                .findByArchiveIdAndAdminUserIdAndRevokedAtIsNull(archiveId, adminUserId)
                .orElseGet(() -> ArchiveGrant.builder()
                        .archiveId(archiveId)
                        .adminUserId(adminUserId)
                        .grantedBy(actor.getId())
                        .grantedAt(LocalDateTime.now())
                        .build());
        grant.setGrantedBy(actor.getId());
        grant.setGrantedAt(LocalDateTime.now());
        grant.setRevokedAt(null);
        grant.setExpiresAt(LocalDateTime.now().plusDays(30));
        grantRepository.save(grant);
        log(archiveId, actor, "GRANT", "adminUserId=" + adminUserId);
        return Map.of("archiveId", archiveId, "adminUserId", adminUserId, "expiresAt", grant.getExpiresAt());
    }

    @Transactional
    public void revoke(User actor, Long archiveId, Long adminUserId) {
        requireSuper(actor);
        ArchiveGrant grant = grantRepository
                .findByArchiveIdAndAdminUserIdAndRevokedAtIsNull(archiveId, adminUserId)
                .orElseThrow(() -> new RuntimeException("授权不存在"));
        grant.setRevokedAt(LocalDateTime.now());
        grantRepository.save(grant);
        log(archiveId, actor, "REVOKE", "adminUserId=" + adminUserId);
    }

    @Transactional
    public void delete(User actor, Long archiveId) {
        requireSuper(actor);
        documentRepository.findById(archiveId).orElseThrow(() -> new RuntimeException("存档不存在"));
        grantRepository.deleteByArchiveId(archiveId);
        accessLogRepository.deleteByArchiveId(archiveId);
        deleteRequestRepository.deleteByArchiveId(archiveId);
        documentRepository.deleteById(archiveId);
    }

    @Transactional
    public Map<String, Object> requestDelete(User actor, Long archiveId, String reason) {
        requireAdmin(actor);
        if (isSuper(actor)) throw new RuntimeException("超级管理员可以直接删除");
        requireRead(actor, archiveId);
        ArchiveDocument doc = documentRepository.findById(archiveId)
                .orElseThrow(() -> new RuntimeException("存档不存在"));
        ArchiveDeleteRequest request = deleteRequestRepository
                .findByArchiveIdAndRequestedByAndStatus(archiveId, actor.getId(), "PENDING")
                .orElseGet(() -> ArchiveDeleteRequest.builder()
                        .archiveId(archiveId)
                        .requestedBy(actor.getId())
                        .createdAt(LocalDateTime.now())
                        .status("PENDING")
                        .build());
        request.setReason(reason == null ? null : reason.substring(0, Math.min(reason.length(), 1000)));
        request.setCreatedAt(LocalDateTime.now());
        request = deleteRequestRepository.save(request);
        log(archiveId, actor, "REQUEST_DELETE", reason);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", request.getId());
        out.put("archiveId", archiveId);
        out.put("title", doc.getSourceTitle());
        out.put("status", request.getStatus());
        return out;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> deleteRequests(User actor) {
        requireSuper(actor);
        return deleteRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream().map(request -> {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("id", request.getId());
            out.put("archiveId", request.getArchiveId());
            out.put("requestedBy", request.getRequestedBy());
            out.put("reason", request.getReason());
            out.put("createdAt", request.getCreatedAt());
            documentRepository.findById(request.getArchiveId()).ifPresent(doc -> out.put("title", doc.getSourceTitle()));
            userRepository.findById(request.getRequestedBy()).ifPresent(user -> out.put("username", user.getUsername()));
            return out;
        }).toList();
    }

    @Transactional
    public void reviewDelete(User actor, Long requestId, boolean approve, String note) {
        requireSuper(actor);
        ArchiveDeleteRequest request = deleteRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("删除申请不存在"));
        if (!"PENDING".equals(request.getStatus())) throw new RuntimeException("该申请已处理");
        request.setStatus(approve ? "APPROVED" : "REJECTED");
        request.setReviewedBy(actor.getId());
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNote(note);
        deleteRequestRepository.save(request);
        log(request.getArchiveId(), actor, approve ? "APPROVE_DELETE" : "REJECT_DELETE", note);
        if (approve) delete(actor, request.getArchiveId());
    }

    private void requireRead(User actor, Long archiveId) {
        if (isSuper(actor)) return;
        if (!"ADMIN".equals(actor.getRole())) throw new RuntimeException("无权访问");
        ArchiveGrant grant = grantRepository
                .findByArchiveIdAndAdminUserIdAndRevokedAtIsNull(archiveId, actor.getId())
                .orElseThrow(() -> new RuntimeException("无权访问"));
        if (!grantActive(grant)) throw new RuntimeException("授权已过期");
    }

    private boolean grantActive(ArchiveGrant grant) {
        return grant.getExpiresAt() == null || grant.getExpiresAt().isAfter(LocalDateTime.now());
    }

    private void requireAdmin(User actor) {
        if (actor == null || (!"ADMIN".equals(actor.getRole()) && !"SUPER_ADMIN".equals(actor.getRole()))) {
            throw new RuntimeException("需要管理员权限");
        }
    }

    private void requireSuper(User actor) {
        if (actor == null || !"SUPER_ADMIN".equals(actor.getRole())) {
            throw new RuntimeException("仅超级管理员可操作");
        }
    }

    private boolean isSuper(User actor) {
        return actor != null && "SUPER_ADMIN".equals(actor.getRole());
    }

    private void log(Long archiveId, User actor, String action, String detail) {
        String ipHash = null;
        String userAgent = null;
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            String ip = forwarded == null || forwarded.isBlank()
                    ? request.getRemoteAddr()
                    : forwarded.split(",")[0].trim();
            if (ip != null && !ip.isBlank()) ipHash = sha256(ip);
            userAgent = request.getHeader("User-Agent");
        }
        accessLogRepository.save(ArchiveAccessLog.builder()
                .archiveId(archiveId)
                .userId(actor.getId())
                .action(action)
                .ipHash(ipHash)
                .userAgent(userAgent == null ? null : userAgent.substring(0, Math.min(userAgent.length(), 500)))
                .detail(detail == null ? null : detail.substring(0, Math.min(detail.length(), 1000)))
                .createdAt(LocalDateTime.now())
                .build());
    }

    private Map<String, Object> toMap(ArchiveDocument doc, boolean includeContent) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", doc.getId());
        out.put("sourceUrl", doc.getSourceUrl());
        out.put("canonicalUrl", doc.getCanonicalUrl());
        out.put("sourceTitle", doc.getSourceTitle());
        out.put("sourceAuthor", doc.getSourceAuthor());
        out.put("sourceSite", doc.getSourceSite());
        out.put("sourcePublishedAt", doc.getSourcePublishedAt());
        out.put("importedAt", doc.getImportedAt());
        out.put("copyrightNote", doc.getCopyrightNote());
        out.put("status", doc.getStatus());
        if (includeContent) out.put("contentHtml", doc.getContentHtml());
        return out;
    }

    private Map<String, Object> toMap(Fetched fetched, boolean includeContent) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sourceUrl", fetched.sourceUrl());
        out.put("canonicalUrl", fetched.canonicalUrl());
        out.put("sourceTitle", fetched.title());
        out.put("sourceAuthor", fetched.author());
        out.put("sourceSite", fetched.site());
        out.put("sourcePublishedAt", fetched.publishedAt());
        out.put("sourceUrlHash", fetched.sourceUrlHash());
        out.put("contentHash", fetched.contentHash());
        if (includeContent) out.put("contentHtml", fetched.html());
        return out;
    }

    private Fetched fetch(String rawUrl) {
        URI uri = validateUrl(rawUrl);
        try {
            HttpResponse<byte[]> response = null;
            URI current = uri;
            for (int i = 0; i <= MAX_REDIRECTS; i++) {
                HttpRequest request = HttpRequest.newBuilder(current)
                        .timeout(Duration.ofSeconds(10))
                        .header("User-Agent", "BaicaiArchive/1.0 (+https://www.zibaicai.cn)")
                        .header("Accept", "text/html,application/xhtml+xml")
                        .GET()
                        .build();
                response = HTTP.send(request, HttpResponse.BodyHandlers.ofByteArray());
                int status = response.statusCode();
                if (status >= 300 && status < 400) {
                    String location = response.headers().firstValue("Location").orElse(null);
                    if (location == null || location.isBlank()) throw new RuntimeException("重定向缺少 Location");
                    current = validateUrl(current.resolve(location).toString());
                    continue;
                }
                if (status < 200 || status >= 300) throw new RuntimeException("抓取失败，HTTP " + status);
                break;
            }
            if (response == null) throw new RuntimeException("抓取失败");

            String contentType = response.headers().firstValue("Content-Type").orElse("");
            if (!contentType.toLowerCase().contains("text/html")
                    && !contentType.toLowerCase().contains("application/xhtml+xml")) {
                throw new RuntimeException("仅支持 HTML 页面");
            }
            byte[] bytes = response.body();
            if (bytes == null || bytes.length == 0) throw new RuntimeException("页面内容为空");
            if (bytes.length > MAX_HTML_BYTES) throw new RuntimeException("页面超过 2MB 限制");

            Document document = Jsoup.parse(new String(bytes, StandardCharsets.UTF_8), current.toString());
            String rawSnapshot = document.outerHtml();
            String title = meta(document, "meta[property=og:title]", "content");
            if (title.isBlank()) title = document.title();
            if (title.isBlank()) title = current.getHost();
            String author = meta(document, "meta[name=author]", "content");
            if (author.isBlank()) author = meta(document, "meta[property=article:author]", "content");
            String published = meta(document, "meta[property=article:published_time]", "content");
            String canonical = document.select("link[rel=canonical]").attr("abs:href");

            document.select("script, style, noscript, iframe, object, embed, form, input, button, link, meta, base, svg, math").remove();
            Element body = document.selectFirst("article");
            if (body == null) body = document.selectFirst("main");
            if (body == null) body = document.selectFirst("[role=main]");
            if (body == null) body = document.body();
            String cleanHtml = body == null ? "" : sanitize(body.html());
            if (cleanHtml.isBlank()) throw new RuntimeException("没有提取到正文");

            String sourceUrl = current.toString();
            String canonicalUrl = canonical == null || canonical.isBlank() ? sourceUrl : canonical;
            return new Fetched(
                    sourceUrl,
                    canonicalUrl,
                    title.substring(0, Math.min(title.length(), 500)),
                    author,
                    current.getHost(),
                    published,
                    sha256(sourceUrl),
                    sha256(cleanHtml),
                    cleanHtml,
                    rawSnapshot
            );
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("抓取失败：" + e.getMessage());
        }
    }

    private String sanitize(String html) {
        String cleaned = POLICY.sanitize(html);
        Document doc = Jsoup.parseBodyFragment(cleaned);
        doc.select("img").forEach(img -> {
            String src = img.attr("src").trim();
            if (!(src.startsWith("http://") || src.startsWith("https://"))) {
                img.remove();
                return;
            }
            img.attr("referrerpolicy", "no-referrer");
            img.attr("loading", "lazy");
        });
        doc.select("a").forEach(link -> {
            String href = link.attr("href").trim().toLowerCase();
            if (!(href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:"))) {
                link.removeAttr("href");
                return;
            }
            link.attr("target", "_blank");
            link.attr("rel", "noopener noreferrer nofollow");
        });
        return doc.body().html();
    }

    private URI validateUrl(String raw) {
        try {
            URI uri = URI.create(raw.trim());
            if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new RuntimeException("仅支持 http / https 链接");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) throw new RuntimeException("链接缺少域名");
            String host = uri.getHost().toLowerCase();
            if ("localhost".equals(host) || host.endsWith(".local")) throw new RuntimeException("不允许访问内网地址");
            for (InetAddress address : InetAddress.getAllByName(host)) {
                if (address.isAnyLocalAddress() || address.isLoopbackAddress()
                        || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                        || address.isMulticastAddress()) {
                    throw new RuntimeException("不允许访问内网地址");
                }
            }
            return uri;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("链接格式无效");
        }
    }

    private String meta(Document document, String selector, String attribute) {
        Element element = document.selectFirst(selector);
        return element == null ? "" : element.attr(attribute).trim();
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception e) {
            throw new RuntimeException("无法计算摘要");
        }
    }

    private String detectImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8'
                && (b[4] == '7' || b[4] == '9') && b[5] == 'a') {
            return "image/gif";
        }
        return null;
    }

    private void validateImageDimensions(byte[] bytes) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (input == null) throw new RuntimeException("图片无法读取");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new RuntimeException("图片格式无法识别");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, false, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_IMAGE_PIXELS) {
                    throw new RuntimeException("图片尺寸过大");
                }
                int frames = reader.getNumImages(true);
                if (frames > MAX_GIF_FRAMES) throw new RuntimeException("动图帧数过多");
            } finally {
                reader.dispose();
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("图片校验失败");
        }
    }

    public record ArchiveImage(byte[] bytes, String contentType) {}

    private record Fetched(
            String sourceUrl,
            String canonicalUrl,
            String title,
            String author,
            String site,
            String publishedAt,
            String sourceUrlHash,
            String contentHash,
            String html,
            String rawSnapshot
    ) {}
}
