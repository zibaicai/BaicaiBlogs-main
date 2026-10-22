package com.baicaiblogs.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

/**
 * 统一清洗用户内容渲染出的 HTML，阻断存储型 XSS。
 *
 * 只允许常见的排版标签与 http/https/mailto 链接、http/https 图片，
 * 脚本、事件属性、iframe、style 等一律丢弃。
 */
public final class HtmlSanitizer {

    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowElements(
                    "p", "br", "hr",
                    "h1", "h2", "h3", "h4", "h5", "h6",
                    "strong", "b", "em", "i", "u", "s", "del", "ins", "mark",
                    "blockquote", "pre", "code",
                    "ul", "ol", "li",
                    "a", "img",
                    "table", "thead", "tbody", "tr", "th", "td",
                    "span", "div", "figure", "figcaption")
            .allowUrlProtocols("http", "https", "mailto")
            .allowAttributes("href", "title").onElements("a")
            .allowAttributes("src", "alt", "title", "width", "height").onElements("img")
            .allowAttributes("class").onElements("code", "pre", "span", "div")
            .requireRelNofollowOnLinks()
            .toFactory();

    private HtmlSanitizer() {
    }

    public static String clean(String html) {
        return html == null ? null : POLICY.sanitize(html);
    }
}
