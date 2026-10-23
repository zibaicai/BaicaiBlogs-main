package com.baicaiblogs.service;

import lombok.RequiredArgsConstructor;
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
import java.util.Iterator;

@Service
@RequiredArgsConstructor
public class ImageVariantService {

    /** 生成指定长边的缩略图；失败时回退原图。 */
    public byte[] resize(byte[] original, int maxWidth, String mime) {
        if (mime != null && mime.contains("gif")) return original;
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(original));
            if (src == null) return original;
            if (src.getWidth() <= maxWidth) return original;

            int width = maxWidth;
            int height = Math.max(1, src.getHeight() * maxWidth / src.getWidth());
            boolean alpha = mime != null && mime.contains("png");
            BufferedImage dst = new BufferedImage(width, height, alpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
            Graphics2D g = dst.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            if (!alpha) {
                g.setColor(Color.WHITE);
                g.fillRect(0, 0, width, height);
            }
            g.drawImage(src, 0, 0, width, height, null);
            g.dispose();

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            if (alpha) {
                ImageIO.write(dst, "png", bos);
            } else {
                Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
                if (!writers.hasNext()) return original;
                ImageWriter writer = writers.next();
                try (ImageOutputStream ios = ImageIO.createImageOutputStream(bos)) {
                    writer.setOutput(ios);
                    ImageWriteParam param = writer.getDefaultWriteParam();
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(0.82f);
                    writer.write(null, new IIOImage(dst, null, null), param);
                } finally {
                    writer.dispose();
                }
            }
            return bos.toByteArray();
        } catch (Exception e) {
            return original;
        }
    }
}
