package com.baicaiblogs.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Iterator;

/**
 * Server-side validation and re-encoding for user-uploaded images.
 * The original bytes are never stored: every accepted image is decoded,
 * bounded, then re-encoded without metadata or trailing payload.
 */
@Slf4j
@Service
public class ImageSecurityService {

    public static final long MAX_BYTES = 10L * 1024 * 1024;
    public static final long MAX_PIXELS = 40_000_000L;

    public record SafeImage(byte[] bytes, String contentType, String extension, int width, int height, String sha256) {}

    public SafeImage sanitize(byte[] original) {
        if (original == null || original.length == 0) throw new RuntimeException("图片内容为空");
        if (original.length > MAX_BYTES) throw new RuntimeException("图片不能超过 10MB");
        String detected = detect(original);
        if (detected == null) throw new RuntimeException("仅支持 JPG / PNG / WebP / GIF 图片");
        if ("avif".equals(detected)) throw new RuntimeException("暂不支持 AVIF 上传，请转换为 JPG / PNG / WebP");

        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(original))) {
            if (input == null) throw new RuntimeException("图片无法读取");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new RuntimeException("图片格式无法识别");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, false, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) {
                    throw new RuntimeException("图片像素尺寸过大");
                }
                if (reader.getNumImages(true) > 1) {
                    throw new RuntimeException("暂不支持动图，请上传静态图片");
                }
                BufferedImage source = reader.read(0);
                if (source == null) throw new RuntimeException("图片解码失败");
                boolean alpha = source.getColorModel().hasAlpha();
                BufferedImage target = new BufferedImage(width, height,
                        alpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
                Graphics2D graphics = target.createGraphics();
                try {
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                            RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    graphics.setRenderingHint(RenderingHints.KEY_RENDERING,
                            RenderingHints.VALUE_RENDER_QUALITY);
                    if (!alpha) {
                        graphics.setColor(Color.WHITE);
                        graphics.fillRect(0, 0, width, height);
                    }
                    graphics.drawImage(source, 0, 0, null);
                } finally {
                    graphics.dispose();
                }

                byte[] encoded;
                String contentType;
                String extension;
                if (alpha) {
                    ByteArrayOutputStream output = new ByteArrayOutputStream();
                    if (!ImageIO.write(target, "png", output)) throw new RuntimeException("图片编码失败");
                    encoded = output.toByteArray();
                    contentType = "image/png";
                    extension = "png";
                } else {
                    encoded = encodeJpeg(target);
                    contentType = "image/jpeg";
                    extension = "jpg";
                }
                if (encoded.length > MAX_BYTES) throw new RuntimeException("处理后图片仍超过 10MB");
                return new SafeImage(encoded, contentType, extension, width, height, sha256(encoded));
            } finally {
                reader.dispose();
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Image security validation failed: {}", e.getMessage());
            throw new RuntimeException("图片校验失败，请更换图片");
        }
    }

    private String detect(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpeg";
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) return "png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8'
                && (b[4] == '7' || b[4] == '9') && b[5] == 'a') return "gif";
        if (b.length >= 12 && b[4] == 'f' && b[5] == 't' && b[6] == 'y' && b[7] == 'p') return "avif";
        return null;
    }

    private byte[] encodeJpeg(BufferedImage image) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) throw new RuntimeException("JPEG 编码器不可用");
        ImageWriter writer = writers.next();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream stream = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(stream);
            ImageWriteParam params = writer.getDefaultWriteParam();
            if (params.canWriteCompressed()) {
                params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                params.setCompressionQuality(0.9f);
            }
            writer.write(null, new IIOImage(image, null, null), params);
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
    }

    private String sha256(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            return null;
        }
    }
}
