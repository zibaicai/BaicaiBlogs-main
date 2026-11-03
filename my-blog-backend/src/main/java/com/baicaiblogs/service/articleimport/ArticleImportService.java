package com.baicaiblogs.service.articleimport;

import com.baicaiblogs.dto.ArticleDtos;
import com.baicaiblogs.entity.ArchiveAsset;
import com.baicaiblogs.entity.ArchiveDocument;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.ArchiveAssetRepository;
import com.baicaiblogs.repository.ArchiveDocumentRepository;
import com.baicaiblogs.service.ArticleService;
import com.baicaiblogs.service.OssService;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ArticleImportService {

    private static final Pattern INTERNAL_ASSET = Pattern.compile("^/api/internal/archive-assets/(\\d+)$");

    private final ArchiveDocumentRepository documentRepository;
    private final ArchiveAssetRepository assetRepository;
    private final ArticleService articleService;
    private final OssService ossService;
    private final List<ArticleSourceAdapter> adapters;

    @Transactional
    public ArticleDtos.ArticleResponse importArchive(User admin, Long archiveId) {
        ArchiveDocument archive = documentRepository.findById(archiveId)
                .orElseThrow(() -> new RuntimeException("存档不存在"));

        ArticleSourceAdapter adapter = adapters.stream()
                .filter(candidate -> candidate.supports(archive.getSourceUrl()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("没有可用的文章适配器"));

        String sourceHtml = "WECHAT".equals(adapterName(adapter))
                ? firstNonBlank(archive.getRawSnapshot(), archive.getContentHtml())
                : firstNonBlank(archive.getContentHtml(), archive.getRawSnapshot());
        ArticleSourceAdapter.ImportedArticle imported = adapter.extract(archive, sourceHtml);

        String content = rehostImages(imported.contentHtml(), archive.getId());
        String cover = rehostCover(imported.cover(), archive.getId());
        String platformLabel = "WECHAT".equals(imported.platform()) ? "公众号" : "导入文章";

        ArticleDtos.ArticleRequest request = ArticleDtos.ArticleRequest.builder()
                .title(firstNonBlank(imported.title(), archive.getSourceTitle(), "未命名文章"))
                .summary(firstNonBlank(imported.summary(), archive.getCopyrightNote()))
                .cover(cover)
                .contentHtml(content)
                .category("文章")
                .tags(List.of(platformLabel))
                .status("DRAFT")
                .visibility("PRIVATE")
                .sourcePlatform(imported.platform())
                .sourceUrl(archive.getSourceUrl())
                .sourceAuthor(firstNonBlank(imported.author(), archive.getSourceAuthor()))
                .sourceArchiveId(archive.getId())
                .build();
        return articleService.create(admin, request);
    }

    private String adapterName(ArticleSourceAdapter adapter) {
        return adapter.getClass().getSimpleName().toLowerCase().contains("wechat") ? "WECHAT" : "GENERIC";
    }

    private String rehostImages(String html, Long archiveId) {
        if (html == null || html.isBlank()) return "";
        Map<String, ArchiveAsset> assetsBySource = new HashMap<>();
        for (ArchiveAsset asset : assetRepository.findByArchiveId(archiveId)) {
            assetsBySource.put(asset.getSourceUrl(), asset);
        }
        Document document = Jsoup.parseBodyFragment(html);
        document.select("img").forEach(img -> {
            String src = img.attr("src").trim();
            ArchiveAsset asset = resolveAsset(src, assetsBySource);
            if (asset == null) {
                if (src.startsWith("/api/internal/archive-assets/")) img.remove();
                return;
            }
            try {
                byte[] bytes = asset.getStorageKey() == null
                        ? asset.getData()
                        : ossService.getArchiveAsset(asset.getStorageKey());
                if (bytes == null || bytes.length == 0) {
                    img.remove();
                    return;
                }
                img.attr("src", articleService.uploadImportedImage(bytes));
                img.attr("referrerpolicy", "no-referrer");
                img.attr("loading", "lazy");
            } catch (Exception e) {
                img.remove();
            }
        });
        return document.body().html();
    }

    private String rehostCover(String cover, Long archiveId) {
        if (cover == null || cover.isBlank()) return "";
        Map<String, ArchiveAsset> assetsBySource = new HashMap<>();
        for (ArchiveAsset asset : assetRepository.findByArchiveId(archiveId)) {
            assetsBySource.put(asset.getSourceUrl(), asset);
        }
        ArchiveAsset asset = resolveAsset(cover, assetsBySource);
        if (asset == null) return cover;
        try {
            byte[] bytes = asset.getStorageKey() == null ? asset.getData() : ossService.getArchiveAsset(asset.getStorageKey());
            return bytes == null || bytes.length == 0 ? cover : articleService.uploadImportedImage(bytes);
        } catch (Exception e) {
            return cover;
        }
    }

    private ArchiveAsset resolveAsset(String src, Map<String, ArchiveAsset> assetsBySource) {
        if (src == null || src.isBlank()) return null;
        Matcher matcher = INTERNAL_ASSET.matcher(src);
        if (matcher.matches()) {
            try {
                return assetRepository.findById(Long.parseLong(matcher.group(1))).orElse(null);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return assetsBySource.get(src);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }
}
