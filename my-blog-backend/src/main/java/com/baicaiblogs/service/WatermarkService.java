package com.baicaiblogs.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class WatermarkService {

    private final OssService ossService;
    private byte[] watermarkBytes;

    @PostConstruct
    public void init() {
        try (InputStream in = new ClassPathResource("watermark.png").getInputStream()) {
            watermarkBytes = in.readAllBytes();
        } catch (Exception ignored) {
            watermarkBytes = null;
        }
    }

    /**
     * 给原图右下角加“白菜”水印。水印烧进图片，不能通过 CSS 去掉。
     */
    public byte[] apply(String objectKey, String mime) {
        byte[] original = ossService.getObjectBytes(objectKey);
        if (watermarkBytes == null) return original;
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(original));
            if (src == null) return original;
            BufferedImage canvas = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = canvas.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.drawImage(src, 0, 0, null);

            BufferedImage wm = ImageIO.read(new ByteArrayInputStream(watermarkBytes));
            int wmWidth = Math.max(90, Math.min(200, (int) (src.getWidth() * 0.07)));
            int wmHeight = Math.max(45, wmWidth * wm.getHeight() / wm.getWidth());
            int margin = Math.max(16, src.getWidth() / 60);
            int x = src.getWidth() - wmWidth - margin;
            int y = src.getHeight() - wmHeight - margin;

            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.10f));
            g.setColor(Color.BLACK);
            g.fillRoundRect(x - 6, y - 4, wmWidth + 12, wmHeight + 8, 12, 12);

            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.28f));
            g.drawImage(wm, x, y, wmWidth, wmHeight, null);
            g.dispose();

            boolean png = mime != null && mime.contains("png");
            BufferedImage out = canvas;
            if (!png) {
                out = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
                Graphics2D g2 = out.createGraphics();
                g2.setColor(Color.WHITE);
                g2.fillRect(0, 0, out.getWidth(), out.getHeight());
                g2.drawImage(canvas, 0, 0, null);
                g2.dispose();
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ImageIO.write(out, png ? "png" : "jpg", bos);
            return bos.toByteArray();
        } catch (Exception e) {
            return original;
        }
    }
}
