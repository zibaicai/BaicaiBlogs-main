package com.baicaiblogs.service.articleimport;

import com.baicaiblogs.entity.ArchiveDocument;
import com.baicaiblogs.util.CodeBlockNormalizer;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

@Component
@Order(1)
public class WeChatArticleAdapter implements ArticleSourceAdapter {

    @Override
    public boolean supports(String sourceUrl) {
        return sourceUrl != null && sourceUrl.contains("mp.weixin.qq.com");
    }

    @Override
    public ImportedArticle extract(ArchiveDocument archive, String html) {
        Document document = Jsoup.parse(html == null ? "" : html, archive.getSourceUrl());
        Element body = document.selectFirst("#js_content");
        if (body == null) {
            throw new RuntimeException("未找到公众号正文，可能需要在微信中打开该文章");
        }

        document.select("script, style, noscript, iframe, object, embed, form, input, button").remove();
        body.select("script, style, noscript, iframe, object, embed, form, input, button").remove();
        body.select("section").forEach(Element::unwrap);
        CodeBlockNormalizer.normalize(document);

        body.select("img").forEach(img -> {
            String source = firstNonBlank(img.attr("data-src"), img.attr("src"));
            if (!source.isBlank()) img.attr("src", source);
            img.removeAttr("data-src");
            img.removeAttr("data-original");
            img.attr("referrerpolicy", "no-referrer");
            img.attr("loading", "lazy");
        });
        body.select("*").forEach(element -> {
            element.removeAttr("style");
            element.removeAttr("class");
            element.removeAttr("id");
            element.attributes().asList().stream()
                    .filter(attribute -> attribute.getKey().startsWith("data-"))
                    .map(org.jsoup.nodes.Attribute::getKey)
                    .toList()
                    .forEach(element::removeAttr);
        });
        body.select("a").forEach(link -> {
            link.attr("target", "_blank");
            link.attr("rel", "noopener noreferrer nofollow");
        });

        String title = text(document, "#activity-name");
        if (title.isBlank()) title = meta(document, "meta[property=og:title]");
        if (title.isBlank()) title = archive.getSourceTitle();
        String author = text(document, "#js_name");
        if (author.isBlank()) author = archive.getSourceAuthor();
        String summary = meta(document, "meta[name=description]");
        if (summary.isBlank()) summary = meta(document, "meta[property=og:description]");
        String cover = meta(document, "meta[property=og:image]");
        if (cover.isBlank()) cover = meta(document, "meta[name=twitter:image]");

        return new ImportedArticle("WECHAT", title, author, summary, cover, body.html());
    }

    private String text(Document document, String selector) {
        Element element = document.selectFirst(selector);
        return element == null ? "" : element.text().trim();
    }

    private String meta(Document document, String selector) {
        Element element = document.selectFirst(selector);
        return element == null ? "" : element.attr("content").trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return "";
    }
}
