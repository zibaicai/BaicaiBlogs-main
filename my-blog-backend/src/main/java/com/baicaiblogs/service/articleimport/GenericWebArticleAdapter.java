package com.baicaiblogs.service.articleimport;

import com.baicaiblogs.entity.ArchiveDocument;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

@Component
@Order(2)
public class GenericWebArticleAdapter implements ArticleSourceAdapter {

    @Override
    public boolean supports(String sourceUrl) {
        return true;
    }

    @Override
    public ImportedArticle extract(ArchiveDocument archive, String html) {
        Document document = Jsoup.parse(html == null ? "" : html, archive.getSourceUrl());
        document.select("script, style, noscript, iframe, object, embed, form, input, button").remove();
        document.select("section").forEach(Element::unwrap);
        document.select("*").forEach(element -> {
            element.removeAttr("style");
            element.removeAttr("class");
            element.removeAttr("id");
        });
        document.select("img").forEach(img -> {
            String source = firstNonBlank(img.attr("data-src"), img.attr("src"));
            if (!source.isBlank()) img.attr("src", source);
            img.removeAttr("data-src");
            img.attr("referrerpolicy", "no-referrer");
            img.attr("loading", "lazy");
        });

        String body = document.body() == null ? "" : document.body().html();
        String summary = meta(document, "meta[name=description]");
        String cover = meta(document, "meta[property=og:image]");
        return new ImportedArticle(
                "GENERIC",
                archive.getSourceTitle(),
                archive.getSourceAuthor(),
                summary,
                cover,
                body
        );
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
