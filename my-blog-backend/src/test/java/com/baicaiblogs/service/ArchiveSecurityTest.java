package com.baicaiblogs.service;

import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ArchiveSecurityTest {

    private final ArchiveService service = new ArchiveService(null, null, null, null, null, null, null);

    private Object invoke(String method, Object... args) throws Exception {
        Class<?>[] types = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) types[i] = args[i].getClass();
        Method target = ArchiveService.class.getDeclaredMethod(method, types);
        target.setAccessible(true);
        return target.invoke(service, args);
    }

    @Test
    void stripsScriptTagsAndEventHandlers() throws Exception {
        String html = "<p>safe</p><script>alert(1)</script>"
                + "<img src=\"https://example.com/a.png\" onerror=\"alert(1)\">"
                + "<a href=\"javascript:alert(1)\">bad</a>";
        String cleaned = (String) invoke("sanitize", html);
        assertTrue(cleaned.contains("safe"));
        assertFalse(cleaned.toLowerCase().contains("<script"));
        assertFalse(cleaned.toLowerCase().contains("onerror"));
        assertFalse(cleaned.toLowerCase().contains("javascript:"));
    }

    @Test
    void handlesNestedAndMixedCasePayloads() throws Exception {
        String html = "<ScRiPt>alert(1)</sCrIpT>"
                + "<scr<script>ipt>alert(2)</scr<script>ipt>"
                + "<img src=x onerror=alert(3)>";
        String cleaned = (String) invoke("sanitize", html);
        assertFalse(cleaned.toLowerCase().contains("<script"));
        assertFalse(cleaned.toLowerCase().contains("onerror"));
    }

    @Test
    void stripsIframeAndSvg() throws Exception {
        String cleaned = (String) invoke("sanitize",
                "<iframe src=\"https://evil.example\"></iframe><svg onload=alert(1)></svg><p>ok</p>");
        assertFalse(cleaned.toLowerCase().contains("<iframe"));
        assertFalse(cleaned.toLowerCase().contains("<svg"));
        assertTrue(cleaned.contains("ok"));
    }

    @Test
    void blocksLocalAndPrivateUrls() {
        for (String url : new String[]{
                "file:///etc/passwd",
                "javascript:alert(1)",
                "http://127.0.0.1/",
                "http://localhost/",
                "http://169.254.169.254/latest/meta-data",
                "http://10.0.0.1/",
                "http://192.168.1.1/"
        }) {
            assertThrows(InvocationTargetException.class, () -> invoke("validateUrl", url), url);
        }
    }
}
