package com.baicaiblogs.service.articleimport;

import com.baicaiblogs.entity.ArchiveDocument;

/**
 * Converts a platform-specific article snapshot into the canonical article draft.
 * Platform differences must stop here; ArticleService stays platform-agnostic.
 */
public interface ArticleSourceAdapter {

    boolean supports(String sourceUrl);

    ImportedArticle extract(ArchiveDocument archive, String html);

    record ImportedArticle(
            String platform,
            String title,
            String author,
            String summary,
            String cover,
            String contentHtml
    ) {
    }
}
