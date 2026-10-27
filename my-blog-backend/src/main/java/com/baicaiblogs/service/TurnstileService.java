package com.baicaiblogs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class TurnstileService {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper;

    @Value("${app.turnstile.secret:}")
    private String secret;

    @Value("${app.turnstile.site-key:}")
    private String siteKey;

    public boolean isConfigured() {
        return secret != null && !secret.isBlank() && siteKey != null && !siteKey.isBlank();
    }

    public String getSiteKey() {
        return siteKey;
    }

    public void verify(String token, String ip) {
        if (!isConfigured()) {
            throw new RuntimeException("注册验证尚未配置，暂时关闭注册");
        }
        if (token == null || token.isBlank()) {
            throw new RuntimeException("请完成人机验证");
        }
        try {
            String body = "secret=" + enc(secret) + "&response=" + enc(token)
                    + (ip == null ? "" : "&remoteip=" + enc(ip));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://challenges.cloudflare.com/turnstile/v0/siteverify"))
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) throw new RuntimeException("人机验证服务暂不可用");
            JsonNode root = objectMapper.readTree(response.body());
            if (!root.path("success").asBoolean(false)) {
                throw new RuntimeException("人机验证失败，请刷新后重试");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("人机验证服务暂不可用");
        }
    }

    private String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
