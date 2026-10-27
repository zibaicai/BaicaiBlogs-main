package com.baicaiblogs.service;

import com.baicaiblogs.dto.ArticleDtos;
import com.baicaiblogs.entity.Article;
import com.baicaiblogs.entity.Category;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.ArticleRepository;
import com.baicaiblogs.repository.CategoryRepository;
import com.baicaiblogs.repository.UserRepository;
import com.baicaiblogs.util.ArticleHtmlSanitizer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ImageSecurityService imageSecurityService;
    private final OssService ossService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ArticleDtos.ArticleResponse> publicList() {
        return articleRepository.findByStatusAndVisibilityOrderByPublishedAtDesc("PUBLISHED", "PUBLIC")
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ArticleDtos.ArticleResponse publicGet(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .filter(a -> "PUBLISHED".equals(a.getStatus()) && "PUBLIC".equals(a.getVisibility()))
                .orElseThrow(() -> new RuntimeException("文章不存在或未公开"));
        return toResponse(article);
    }

    @Transactional(readOnly = true)
    public List<ArticleDtos.ArticleResponse> adminList(User admin) {
        requireAdmin(admin);
        return articleRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ArticleDtos.ArticleResponse adminGet(User admin, Long id) {
        requireAdmin(admin);
        return toResponse(articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文章不存在")));
    }

    @Transactional
    public ArticleDtos.ArticleResponse create(User admin, ArticleDtos.ArticleRequest request) {
        requireAdmin(admin);
        String title = trim(request.getTitle());
        String html = ArticleHtmlSanitizer.clean(request.getContentHtml());
        if (title.length() < 2) throw new RuntimeException("标题至少 2 个字符");
        if (html == null || html.replaceAll("<[^>]*>", "").trim().length() < 10) {
            throw new RuntimeException("文章正文太短");
        }
        String text = plainText(html);
        String status = normalizeStatus(request.getStatus());
        Category category = resolveCategory(request.getCategoryId());
        Article article = Article.builder()
                .userId(admin.getId())
                .slug(uniqueSlug(title))
                .title(title)
                .subtitle(trim(request.getSubtitle()))
                .cover(trim(request.getCover()))
                .summary(defaultSummary(request.getSummary(), text))
                .contentHtml(html)
                .contentText(text)
                .category(category != null ? category.getName() : trim(request.getCategory()))
                .categoryId(category != null ? category.getId() : null)
                .tags(writeTags(request.getTags()))
                .status(status)
                .visibility(normalizeVisibility(request.getVisibility()))
                .readingTime(readingTime(text))
                .publishedAt("PUBLISHED".equals(status) ? LocalDateTime.now() : null)
                .build();
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public ArticleDtos.ArticleResponse update(User admin, Long id, ArticleDtos.ArticleRequest request) {
        requireAdmin(admin);
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文章不存在"));
        String title = trim(request.getTitle());
        String html = ArticleHtmlSanitizer.clean(request.getContentHtml());
        if (title.length() < 2) throw new RuntimeException("标题至少 2 个字符");
        if (html == null || html.replaceAll("<[^>]*>", "").trim().length() < 10) {
            throw new RuntimeException("文章正文太短");
        }
        String text = plainText(html);
        String status = normalizeStatus(request.getStatus());
        Category category = resolveCategory(request.getCategoryId());
        article.setTitle(title);
        article.setSubtitle(trim(request.getSubtitle()));
        article.setCover(trim(request.getCover()));
        article.setSummary(defaultSummary(request.getSummary(), text));
        article.setContentHtml(html);
        article.setContentText(text);
        article.setCategory(category != null ? category.getName() : trim(request.getCategory()));
        article.setCategoryId(category != null ? category.getId() : null);
        article.setTags(writeTags(request.getTags()));
        article.setStatus(status);
        article.setVisibility(normalizeVisibility(request.getVisibility()));
        article.setReadingTime(readingTime(text));
        if ("PUBLISHED".equals(status) && article.getPublishedAt() == null) {
            article.setPublishedAt(LocalDateTime.now());
        }
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public void delete(User admin, Long id) {
        requireAdmin(admin);
        articleRepository.deleteById(id);
    }

    @Transactional
    public String uploadImage(User admin, MultipartFile file) {
        requireAdmin(admin);
        if (file == null || file.isEmpty()) throw new RuntimeException("请选择图片");
        if (file.getSize() > ImageSecurityService.MAX_BYTES) throw new RuntimeException("图片不能超过 10MB");
        try {
            ImageSecurityService.SafeImage safe = imageSecurityService.sanitize(file.getBytes());
            String key = "articles/" + LocalDateTime.now().toLocalDate() + "/"
                    + UUID.randomUUID().toString().replace("-", "") + "." + safe.extension();
            ossService.putObject(key, safe.bytes(), safe.contentType());
            return "/api/public/articles/images?key=" + URLEncoder.encode(key, StandardCharsets.UTF_8);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("图片上传失败");
        }
    }

    @Transactional(readOnly = true)
    public byte[] imageBytes(String key) {
        if (key == null || !key.startsWith("articles/") || key.contains("..") || key.contains("\\")) {
            throw new RuntimeException("图片不存在");
        }
        return ossService.getObjectBytes(key);
    }

    @Transactional(readOnly = true)
    public String imageContentType(String key) {
        String lower = key == null ? "" : key.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private ArticleDtos.ArticleResponse toResponse(Article article) {
        String author = userRepository.findById(article.getUserId())
                .map(u -> u.getNickname() == null ? u.getUsername() : u.getNickname())
                .orElse("管理员");
        Category category = article.getCategoryId() == null ? null
                : categoryRepository.findById(article.getCategoryId()).orElse(null);
        return ArticleDtos.ArticleResponse.builder()
                .id(article.getId())
                .userId(article.getUserId())
                .author(author)
                .slug(article.getSlug())
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .cover(article.getCover())
                .summary(article.getSummary())
                .contentHtml(article.getContentHtml())
                .contentText(article.getContentText())
                .category(category != null ? category.getName() : article.getCategory())
                .categoryId(category != null ? category.getId() : article.getCategoryId())
                .categoryPath(category != null ? category.getPath() : article.getCategory())
                .tags(readTags(article.getTags()))
                .status(article.getStatus())
                .visibility(article.getVisibility())
                .readingTime(article.getReadingTime())
                .publishedAt(article.getPublishedAt())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    private Category resolveCategory(Long categoryId) {
        return categoryId == null ? null : categoryRepository.findById(categoryId).orElse(null);
    }

    private String uniqueSlug(String title) {
        String base = Normalizer.normalize(title, Normalizer.Form.NFKD)
                .replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase(Locale.ROOT);
        if (base.isBlank()) base = "article";
        if (base.length() > 120) base = base.substring(0, 120);
        String slug = base;
        int suffix = 2;
        while (articleRepository.existsBySlug(slug)) slug = base + "-" + suffix++;
        return slug;
    }

    private String plainText(String html) {
        return html.replaceAll("(?s)<script.*?</script>", " ")
                .replaceAll("<[^>]+>", " ")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String defaultSummary(String summary, String text) {
        String value = trim(summary);
        if (value.isBlank()) value = text;
        return value.length() > 180 ? value.substring(0, 180) : value;
    }

    private int readingTime(String text) {
        return Math.max(1, (int) Math.ceil(text.length() / 500.0));
    }

    private String normalizeStatus(String status) {
        return "PUBLISHED".equalsIgnoreCase(status) ? "PUBLISHED" : "DRAFT";
    }

    private String normalizeVisibility(String visibility) {
        return "PRIVATE".equalsIgnoreCase(visibility) ? "PRIVATE" : "PUBLIC";
    }

    private String writeTags(List<String> tags) {
        try {
            return objectMapper.writeValueAsString(tags == null ? List.of() : tags);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> readTags(String tags) {
        try {
            return tags == null || tags.isBlank() ? List.of()
                    : objectMapper.readValue(tags, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private void requireAdmin(User user) {
        if (user == null) throw new RuntimeException("请先登录");
        if (!"ADMIN".equals(user.getRole()) && !"SUPER_ADMIN".equals(user.getRole())) {
            throw new RuntimeException("需要管理员权限");
        }
    }
}
