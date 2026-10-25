package com.baicaiblogs.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Cover images are never rendered larger than 804x452 on the public article page.
 * Resize and re-encode them before storing in OSS to avoid wasting object storage.
 */
@Service
@Slf4j
public class ImageCompressionService {

    public static final int COVER_WIDTH = 804;
    public static final int COVER_HEIGHT = 452;

    public record CompressedImage(byte[] bytes, String contentType, String extension) {}

    public CompressedImage compressCover(byte[] original, String originalFilename) {
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(original));
            if (source == null) {
                log.warn("Unsupported cover image format, storing original: {}", originalFilename);
                return originalImage(original, originalFilename);
            }

            // Center-crop to the 16:9 cover ratio before scaling, matching object-fit: cover.
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

            byte[] jpeg = writeJpeg(target, 0.82f);
            log.info("Compressed cover {}: {} bytes -> {} bytes", originalFilename, original.length, jpeg.length);
            return new CompressedImage(jpeg, "image/jpeg", "jpg");
        } catch (Exception e) {
            log.warn("Cover compression failed, storing original: {}", originalFilename, e);
            return originalImage(original, originalFilename);
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

    private CompressedImage originalImage(byte[] original, String filename) {
        String ext = "jpg";
        if (filename != null && filename.contains(".")) {
            ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        String type = switch (ext) {
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "avif" -> "image/avif";
            default -> "image/jpeg";
        };
        return new CompressedImage(original, type, ext);
    }
}
