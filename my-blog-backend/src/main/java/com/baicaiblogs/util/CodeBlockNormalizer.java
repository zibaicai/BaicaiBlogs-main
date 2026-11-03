package com.baicaiblogs.util;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.stream.Collectors;

/**
 * WeChat emits one <code> element per source line inside a single <pre>.
 * Rich-text editors expect one code element with newline-separated text.
 */
public final class CodeBlockNormalizer {

    private CodeBlockNormalizer() {
    }

    public static void normalize(Document document) {
        for (Element pre : document.select("pre")) {
            Elements codes = pre.select(":scope > code");
            if (codes.size() > 1) {
                String text = codes.stream()
                        .map(Element::wholeText)
                        .collect(Collectors.joining("\n"));
                pre.empty();
                pre.appendElement("code").text(text);
            } else if (codes.isEmpty()) {
                String text = pre.wholeText();
                pre.empty();
                pre.appendElement("code").text(text);
            }
        }
    }
}
