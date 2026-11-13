package com.baicaiblogs.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

@Service
public class TotpService {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return base32Encode(bytes);
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null) return false;
        String normalized = code.replaceAll("\\s+", "");
        if (!normalized.matches("\\d{6}")) return false;
        long counter = Instant.now().getEpochSecond() / 30;
        for (long offset = -1; offset <= 1; offset++) {
            if (normalized.equals(code(secret, counter + offset))) return true;
        }
        return false;
    }

    public String otpauthUrl(String issuer, String username, String secret) {
        return "otpauth://totp/" + urlEncode(issuer) + ":" + urlEncode(username)
                + "?secret=" + secret + "&issuer=" + urlEncode(issuer) + "&digits=6&period=30";
    }

    private String code(String secret, long counter) {
        try {
            byte[] key = base32Decode(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            return String.format("%06d", binary % 1_000_000);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP 计算失败", e);
        }
    }

    private String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                result.append(ALPHABET.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) result.append(ALPHABET.charAt((buffer << (5 - bits)) & 31));
        return result.toString();
    }

    private byte[] base32Decode(String input) {
        String value = input.replace("=", "").toUpperCase();
        ByteBuffer result = ByteBuffer.allocate(value.length() * 5 / 8 + 1);
        int buffer = 0;
        int bits = 0;
        for (char c : value.toCharArray()) {
            int index = ALPHABET.indexOf(c);
            if (index < 0) throw new IllegalArgumentException("Invalid base32");
            buffer = (buffer << 5) | index;
            bits += 5;
            if (bits >= 8) {
                result.put((byte) ((buffer >> (bits - 8)) & 0xff));
                bits -= 8;
            }
        }
        byte[] out = new byte[result.position()];
        result.flip();
        result.get(out);
        return out;
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
