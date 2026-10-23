package com.baicaiblogs.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
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
import java.io.InputStream;
import java.util.Iterator;

@Service
@RequiredArgsConstructor
public class ImageVariantService {

    private byte[] adminViewBytes;

    @PostConstruct
    public void init() {
        try (InputStream in = new ClassPathResource("admin-view.png").getInputStream()) {
            adminViewBytes = in.readAllBytes();
        } catch (Exception ignored) {
            adminViewBytes = null;
        }
    }

    /** 生成指定长边的缩略图；失败时回退原图。 */
    public byte[] resize(byte[] original, int maxWidth, String mime) {
        return resize(original, maxWidth, mime, null);
    }

    /**
     * 生成 400/800 图；adminId 不为空时叠加“管理员查看 · #ID”淡水印。
     * 普通图与授权图使用不同 URL/缓存，避免串图。
     */
    public byte[] resize(byte[] original, int maxWidth, String mime, Long adminId) {
        if (mime != null && mime.contains("gif")) return original;
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(original));
            if (src == null) return original;
            boolean upscaleForMark = adminId != null && src.getWidth() <= maxWidth;
            if (src.getWidth() <= maxWidth && !upscaleForMark) return original;

            int width = Math.min(maxWidth, src.getWidth());
            int height = Math.max(1, src.getHeight() * width / src.getWidth());
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
            if (adminId != null) drawAdminMark(g, width, height, adminId);
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

    private void drawAdminMark(Graphics2D g, int width, int height, Long adminId) {
        try {
            BufferedImage wm = adminViewBytes == null ? null : ImageIO.read(new ByteArrayInputStream(adminViewBytes));
            int markW = Math.max(120, Math.min(250, (int) (width * 0.28)));
            int markH = Math.max(38, (int) (markW * 0.30));
            int margin = Math.max(10, width / 70);
            int x = width - markW - margin;
            int y = height - markH - margin;

            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.14f));
            g.setColor(Color.BLACK);
            g.fillRoundRect(x - 6, y - 4, markW + 12, markH + 8, 10, 10);

            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.28f));
            if (wm != null) g.drawImage(wm, x, y, markW, Math.max(20, (int) (markH * 0.64)), null);
            int fontSize = Math.max(10, (int) (markH * 0.28));
            g.setFont(new Font("SansSerif", Font.BOLD, fontSize));
            g.setColor(Color.WHITE);
            g.drawString("#" + adminId, x + 8, y + markH - 5);
        } catch (Exception ignored) {
        }
    }

    /** 生成低分辨率模糊封面；用于密码相册锁定态，不暴露原图。 */
    public byte[] blur(byte[] original) {
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(original));
            if (src == null) return original;
            int width = 24;
            int height = Math.max(1, src.getHeight() * width / src.getWidth());
            BufferedImage small = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = small.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, width, height);
            g.drawImage(src, 0, 0, width, height, null);
            g.dispose();

            BufferedImage out = new BufferedImage(width * 4, height * 4, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2 = out.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2.drawImage(small, 0, 0, out.getWidth(), out.getHeight(), null);
            g2.dispose();

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ImageIO.write(out, "jpg", bos);
            return bos.toByteArray();
        } catch (Exception e) {
            return original;
        }
    }
}
