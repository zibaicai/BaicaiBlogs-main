package com.baicaiblogs.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

/**
 * Article HTML is editor-generated, so it may contain safe inline styles.
 * Styling is sanitized by the OWASP CSS policy; scripts/frames/events are dropped.
 */
public final class ArticleHtmlSanitizer {

    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowElements(
                    "p", "br", "hr",
                    "h1", "h2", "h3", "h4",
                    "strong", "b", "em", "i", "u", "s", "del", "mark",
                    "blockquote", "pre", "code",
                    "ul", "ol", "li",
                    "a", "img",
                    "figure", "figcaption",
                    "span", "div")
            .allowUrlProtocols("http", "https", "mailto")
            .allowAttributes("href", "title", "target").onElements("a")
            .allowAttributes("src", "alt", "title", "width", "height").onElements("img")
            .allowAttributes("class", "style").onElements(
                    "p", "h1", "h2", "h3", "h4", "span", "div", "img", "blockquote", "pre", "code")
            .allowStyling()
            .requireRelNofollowOnLinks()
            .toFactory();

    private ArticleHtmlSanitizer() {
    }

    public static String clean(String html) {
        return html == null ? null : POLICY.sanitize(html);
    }
}
