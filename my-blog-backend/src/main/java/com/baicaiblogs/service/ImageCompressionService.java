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
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Cover images are rendered at most 932x525 on the public article page.
 * Decode, validate, crop and re-encode every uploaded file before it reaches OSS.
 */
@Service
@Slf4j
public class ImageCompressionService {

    public static final int COVER_WIDTH = 932;
    public static final int COVER_HEIGHT = 525;
    private static final long MAX_PIXELS = 40_000_000L;

    public record CompressedImage(byte[] bytes, String contentType, String extension) {}

    public CompressedImage compressBackground(byte[] original, String originalFilename) {
        validateMagic(original);
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(original))) {
            if (input == null) throw new RuntimeException("无法读取图片数据");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new RuntimeException("图片格式无法识别，仅支持 JPEG / PNG / WebP");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, false, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) {
                    throw new RuntimeException("图片像素尺寸过大");
                }
                BufferedImage source = reader.read(0);
                if (source == null) throw new RuntimeException("图片解码失败");
                double scale = Math.min(1d, Math.min(1920d / width, 1080d / height));
                int targetWidth = Math.max(1, (int) Math.round(width * scale));
                int targetHeight = Math.max(1, (int) Math.round(height * scale));
                BufferedImage target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D graphics = target.createGraphics();
                try {
                    graphics.setColor(Color.WHITE);
                    graphics.fillRect(0, 0, targetWidth, targetHeight);
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                    graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
                } finally {
                    graphics.dispose();
                }
                return new CompressedImage(writeJpeg(target, 0.86f), "image/jpeg", "jpg");
            } finally {
                reader.dispose();
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Background compression failed: {}", originalFilename, e);
            throw new RuntimeException("背景图处理失败，请换一张图片重试");
        }
    }

    public CompressedImage compressCover(byte[] original, String originalFilename) {
        validateMagic(original);
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(original))) {
            if (input == null) throw new RuntimeException("无法读取图片数据");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new RuntimeException("图片格式无法识别，仅支持 JPEG / PNG / WebP");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, false, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) {
                    throw new RuntimeException("图片像素尺寸过大");
                }
                BufferedImage source = reader.read(0);
                if (source == null) throw new RuntimeException("图片解码失败");
                return new CompressedImage(encodeCover(source), "image/jpeg", "jpg");
            } finally {
                reader.dispose();
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Cover compression failed: {}", originalFilename, e);
            throw new RuntimeException("图片处理失败，请换一张图片重试");
        }
    }

    private byte[] encodeCover(BufferedImage source) throws IOException {
        // Center-crop to the cover aspect ratio before scaling.
        double targetRatio = (double) COVER_WIDTH / COVER_HEIGHT;
        int cropWidth = source.getWidth();
        int cropHeight = source.getHeight();
        if ((double) cropWidth / cropHeight > targetRatio) {
            cropWidth = (int) Math.round(cropHeight * targetRatio);
        } else {
            cropHeight = (int) Math.round(cropWidth / targetRatio);
        }
        int cropX = (source.getWidth() - cropWidth) / 2;
        int cropY = (source.getHeight() - cropHeight) / 2;

        BufferedImage target = new BufferedImage(COVER_WIDTH, COVER_HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(source, 0, 0, COVER_WIDTH, COVER_HEIGHT,
                    cropX, cropY, cropX + cropWidth, cropY + cropHeight, null);
        } finally {
            graphics.dispose();
        }
        return writeJpeg(target, 0.82f);
    }

    private void validateMagic(byte[] bytes) {
        if (bytes == null || bytes.length < 12) throw new RuntimeException("图片数据不完整");
        boolean jpeg = (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF;
        boolean png = (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
        boolean webp = bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
        if (!jpeg && !png && !webp) {
            throw new RuntimeException("仅支持 JPEG / PNG / WebP 图片");
        }
    }

    private byte[] writeJpeg(BufferedImage image, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) throw new IOException("No JPEG writer available");
        ImageWriter writer = writers.next();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream stream = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(stream);
            ImageWriteParam params = writer.getDefaultWriteParam();
            if (params.canWriteCompressed()) {
                params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                params.setCompressionQuality(quality);
            }
            writer.write(null, new IIOImage(image, null, null), params);
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
    }
}
