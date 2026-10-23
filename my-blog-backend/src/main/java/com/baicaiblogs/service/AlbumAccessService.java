package com.baicaiblogs.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class AlbumAccessService {

    @Value("${jwt.secret}")
    private String secret;

    public static String cookieName(Long albumId) {
        return "BC_ALBUM_" + albumId;
    }

    public String issue(Long albumId, Long userId) {
        long exp = System.currentTimeMillis() / 1000 + 7200;
        String payload = albumId + ":" + userId + ":" + exp;
        String encoded = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + sign(encoded);
    }

    public boolean valid(String token, Long albumId) {
        if (token == null || !token.contains(".")) return false;
        String[] parts = token.split("\\.", 2);
        if (!sign(parts[0]).equals(parts[1])) return false;
        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String[] fields = payload.split(":");
            return fields.length == 3
                    && fields[0].equals(String.valueOf(albumId))
                    && Long.parseLong(fields[2]) > System.currentTimeMillis() / 1000;
        } catch (Exception e) {
            return false;
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("签名失败", e);
        }
    }
}
