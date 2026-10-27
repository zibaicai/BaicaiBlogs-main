package com.baicaiblogs.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.HttpMethod;
import com.aliyun.oss.model.*;
import com.baicaiblogs.config.OssProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.UUID;

/**
 * 阿里云 OSS 对象存储服务
 *
 * 功能：
 * 1. uploadFile: 上传文件（字节数组或原始 InputStream）→ 返回完整可访问 URL
 * 2. deleteFile: 根据 URL 删除 OSS 中的对象
 * 3. downloadContent: 按 URL 下载文本内容（UTF-8）
 *
 * 安全策略：
 * - OSS Client 在每次操作中创建，避免长连接泄漏
 * - 若 OssProperties.isConfigured() == false，则抛出 IllegalStateException 提示用户配置
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssService {

    private final OssProperties ossProperties;

    /**
     * 按 UTF-8 文本内容上传文件
     *
     * @param fileKey      文件名（可以包含子目录），例如 2026/08/14/slug.md
     * @param textContent  文本内容（MD 文件原文）
     * @return 公开可访问的完整 URL
     */
    public String uploadText(String fileKey, String textContent) {
        return uploadBytes(fileKey, textContent.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 按字节数组上传文件
     *
     * @param fileKey 对象键（文件名，可含子目录）
     * @param bytes   原始字节内容
     * @return 公开可访问的完整 URL
     */
    public String uploadBytes(String fileKey, byte[] bytes) {
        return uploadInputStream(fileKey, new ByteArrayInputStream(bytes), bytes.length);
    }

    /**
     * 按 InputStream 上传文件（核心实现）
     *
     * @param fileKey       对象键（文件名）
     * @param inputStream   输入流
     * @param contentLength 内容长度（用于 OSS Content-Length header）
     * @return 公开可访问的完整 URL
     */
    public String uploadInputStream(String fileKey, InputStream inputStream, long contentLength) {
        assertConfigured();

        // 拼接完整对象路径（目录 + 文件键），去掉开头的 / 防止 OSS 根目录错乱
        String objectKey = ossProperties.getDir() + fileKey;
        while (objectKey.startsWith("/")) {
            objectKey = objectKey.substring(1);
        }

        OSS ossClient = buildClient();
        try {
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(contentLength);
            // 根据后缀推断 Content-Type
            if (fileKey.toLowerCase().endsWith(".md") || fileKey.toLowerCase().endsWith(".markdown")) {
                meta.setContentType("text/markdown; charset=UTF-8");
            }

            PutObjectResult result = ossClient.putObject(ossProperties.getBucketName(), objectKey, inputStream, meta);
            log.info("[OssService] 上传成功: bucket={} key={} eTag={}", ossProperties.getBucketName(), objectKey, result.getETag());
            return buildPublicUrl(objectKey);
        } catch (Exception e) {
            log.error("[OssService] 上传失败: key={}", objectKey, e);
            throw new RuntimeException("OSS 上传失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }

    /**
     * 删除 OSS 对象
     *
     * @param fileUrl 完整 URL 或对象键（两种格式都支持）
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;
        assertConfigured();

        // 从完整 URL 解析出对象键
        String objectKey = extractObjectKey(fileUrl);
        if (objectKey == null || objectKey.isEmpty()) return;

        OSS ossClient = buildClient();
        try {
            ossClient.deleteObject(ossProperties.getBucketName(), objectKey);
            log.info("[OssService] 删除成功: bucket={} key={}", ossProperties.getBucketName(), objectKey);
        } catch (Exception e) {
            log.error("[OssService] 删除失败: key={}", objectKey, e);
            // 删除失败不抛异常，避免阻断主流程，只记录日志
        } finally {
            ossClient.shutdown();
        }
    }

    /**
     * Delete only images managed by the site (covers/backgrounds).
     * External URLs and unrelated OSS objects are ignored.
     */
    public boolean deleteManagedImage(String fileUrl) {
        String objectKey = resolveManagedImageKey(fileUrl);
        if (objectKey == null) return false;
        deleteObject(objectKey);
        return true;
    }

    /** Lightweight connectivity check used by the public dashboard. */
    public boolean isHealthy() {
        if (!ossProperties.isConfigured()) return false;
        OSS ossClient = buildClient();
        try {
            // A missing healthcheck object is still a healthy bucket; transport errors are not.
            ossClient.doesObjectExist(ossProperties.getBucketName(), "healthcheck");
            return true;
        } catch (Exception e) {
            log.warn("[OssService] 健康检查失败: {}", e.getMessage());
            return false;
        } finally {
            ossClient.shutdown();
        }
    }

    private String resolveManagedImageKey(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return null;
        try {
            String value = fileUrl.trim();
            int keyQuery = value.indexOf("key=");
            if (keyQuery >= 0) {
                String encoded = value.substring(keyQuery + 4);
                int amp = encoded.indexOf('&');
                if (amp >= 0) encoded = encoded.substring(0, amp);
                value = java.net.URLDecoder.decode(encoded, StandardCharsets.UTF_8);
            } else {
                value = extractObjectKey(value);
            }
            if (value == null) return null;
            value = value.startsWith("/") ? value.substring(1) : value;
            if (value.contains("..") || value.contains("\\")) return null;
            if (!value.startsWith("covers/") && !value.startsWith("backgrounds/")) return null;
            return value;
        } catch (Exception e) {
            log.warn("[OssService] 无法解析托管图片地址: {}", fileUrl, e);
            return null;
        }
    }

    /**
     * 按公开 URL 下载 UTF-8 文本（用于从 OSS 原始 .md 修复被编辑器破坏的文章）。
     */
    public String downloadTextByUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) throw new RuntimeException("文章没有原始文件地址");
        String objectKey = extractObjectKey(fileUrl);
        if (objectKey == null || objectKey.isBlank()) throw new RuntimeException("无法解析原始文件地址");
        try (OSSObject object = getObject(objectKey);
             java.io.InputStream in = object.getObjectContent()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("原始 Markdown 读取失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成唯一文件名（避免重名冲突）
     * 格式：posts/YYYY/MM/DD/{slug}-{8位uuid}.md
     *
     * @param slug 文章 slug
     * @return 拼接好的相对路径文件名（不含 dir 前缀，dir 在 upload 时自动加）
     */
    public String generateUniqueFilename(String slug) {
        String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String shortUuid = UUID.randomUUID().toString().substring(0, 8);
        String safeSlug = (slug == null || slug.isEmpty()) ? "untitled" : slug.replaceAll("[^a-zA-Z0-9_-]", "-");
        return dateDir + "/" + safeSlug + "-" + shortUuid + ".md";
    }

    // ==================== 图片墙能力 ====================

    /** 直接写入对象（不拼接 posts/ 目录），用于模糊封面等衍生图。 */
    public void putObject(String objectKey, byte[] bytes, String contentType) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(bytes.length);
            if (contentType != null) meta.setContentType(contentType);
            ossClient.putObject(ossProperties.getBucketName(), objectKey, new java.io.ByteArrayInputStream(bytes), meta);
        } catch (Exception e) {
            log.error("[OssService] 写入对象失败: key={}", objectKey, e);
            throw new RuntimeException("OSS 写入失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }

    /** Write an object with public-read ACL; used for published article images. */
    public void putPublicObject(String objectKey, byte[] bytes, String contentType) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(bytes.length);
            if (contentType != null) meta.setContentType(contentType);
            ossClient.putObject(ossProperties.getBucketName(), objectKey,
                    new java.io.ByteArrayInputStream(bytes), meta);
            ossClient.setObjectAcl(ossProperties.getBucketName(), objectKey,
                    com.aliyun.oss.model.CannedAccessControlList.PublicRead);
        } catch (Exception e) {
            log.error("[OssService] 公开对象写入失败: key={}", objectKey, e);
            throw new RuntimeException("OSS 公开写入失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }

    /** Write an object with private ACL; used for suggestion attachments. */
    public void putPrivateObject(String objectKey, byte[] bytes, String contentType) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            ObjectMetadata meta = new ObjectMetadata();
            meta.setContentLength(bytes.length);
            if (contentType != null) meta.setContentType(contentType);
            ossClient.putObject(ossProperties.getBucketName(), objectKey,
                    new java.io.ByteArrayInputStream(bytes), meta);
            ossClient.setObjectAcl(ossProperties.getBucketName(), objectKey,
                    com.aliyun.oss.model.CannedAccessControlList.Private);
        } catch (Exception e) {
            log.error("[OssService] 私密对象写入失败: key={}", objectKey, e);
            throw new RuntimeException("OSS 私密写入失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }

    /** 生成原图公开 URL（不经过图片处理）。 */
    public String publicUrl(String objectKey) {
        return buildPublicUrl(objectKey);
    }

    /** 生成 400px 缩略图 URL。 */
    public String thumbUrl(String objectKey) {
        return publicUrl(objectKey) + "?x-oss-process=image/resize,m_lfit,w_400/quality,q_75/format,webp";
    }

    /** 生成 800px 标清图 URL。 */
    public String standardUrl(String objectKey) {
        return publicUrl(objectKey) + "?x-oss-process=image/resize,m_lfit,w_800/quality,q_80/format,webp";
    }

    /** 生成带“白菜”水印的原图处理参数；实际下载由后端代理，避免原图直链。 */
    public static final String WATERMARK_PROCESS =
            "image/watermark,text_55m96I-c,type_d3F5LW1pY3JvaGVp,size_40,color_FFFFFF,t_35,g_se,x_20,y_20";

    /**
     * 生成浏览器直传 OSS 的预签名 PUT URL。
     * key 必须是后端生成的固定前缀，过期时间建议 10 分钟。
     */
    public String presignPut(String objectKey, String contentType, Date expiration) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            GeneratePresignedUrlRequest request =
                    new GeneratePresignedUrlRequest(ossProperties.getBucketName(), objectKey, HttpMethod.PUT);
            request.setExpiration(expiration);
            if (contentType != null) request.setContentType(contentType);
            URL url = ossClient.generatePresignedUrl(request);
            return url.toString().replaceFirst("^http://", "https://");
        } catch (Exception e) {
            log.error("[OssService] 预签名失败: key={}", objectKey, e);
            throw new RuntimeException("OSS 预签名失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }

    /** 读取对象元数据；不存在时返回 null。 */
    public ObjectMetadata headObject(String objectKey) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            return ossClient.getObjectMetadata(ossProperties.getBucketName(), objectKey);
        } catch (Exception e) {
            return null;
        } finally {
            ossClient.shutdown();
        }
    }

    /** 复制对象（举报证据快照）。 */
    public void copyObject(String sourceKey, String destinationKey) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            ossClient.copyObject(ossProperties.getBucketName(), sourceKey,
                    ossProperties.getBucketName(), destinationKey);
        } catch (Exception e) {
            log.error("[OssService] 复制对象失败: {} -> {}", sourceKey, destinationKey, e);
            throw new RuntimeException("OSS 复制失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }

    /** 按对象键删除。 */
    public void deleteObject(String objectKey) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            ossClient.deleteObject(ossProperties.getBucketName(), objectKey);
        } catch (Exception e) {
            log.warn("[OssService] 删除对象失败: {}", objectKey, e);
        } finally {
            ossClient.shutdown();
        }
    }

    /**
     * 获取原始对象（不加图片处理）；调用方负责关闭 OSSObject。
     */
    public OSSObject getObject(String objectKey) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            return ossClient.getObject(ossProperties.getBucketName(), objectKey);
        } catch (Exception e) {
            ossClient.shutdown();
            throw new RuntimeException("OSS 对象读取失败: " + e.getMessage(), e);
        }
    }

    /** 读取对象全部字节，供后端加水印。 */
    public byte[] getObjectBytes(String objectKey) {
        try (OSSObject object = getObject(objectKey);
             InputStream in = object.getObjectContent()) {
            return in.readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("OSS 原图读取失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取带水印的原图对象；调用方负责关闭 OSSObject。
     * 使用 OSS 图片处理，避免在服务器上安装图像库。
     */
    public OSSObject getOriginalWithWatermark(String objectKey) {
        assertConfigured();
        OSS ossClient = buildClient();
        try {
            GetObjectRequest request = new GetObjectRequest(ossProperties.getBucketName(), objectKey);
            request.setProcess(WATERMARK_PROCESS);
            return ossClient.getObject(request);
        } catch (Exception e) {
            ossClient.shutdown();
            log.error("[OssService] 获取原图失败: {}", objectKey, e);
            throw new RuntimeException("OSS 原图读取失败: " + e.getMessage(), e);
        }
    }

    // ==================== 私有辅助方法 ====================

    /** 构建 OSS 客户端 */
    private OSS buildClient() {
        return new OSSClientBuilder().build(
                ossProperties.getEndpoint(),
                ossProperties.getAccessKeyId(),
                ossProperties.getAccessKeySecret()
        );
    }

    /** 检查配置是否有效，无效时抛出异常 */
    private void assertConfigured() {
        if (!ossProperties.isConfigured()) {
            throw new IllegalStateException(
                    "阿里云 OSS 未配置，请在 application.yml 的 app.oss 节填入 endpoint/accessKey/bucket/publicUrlPrefix 等信息后重启服务");
        }
    }

    /** 拼接对象公开访问 URL */
    private String buildPublicUrl(String objectKey) {
        String prefix = ossProperties.getPublicUrlPrefix();
        // 保证 prefix 末尾没有 /，key 开头没有 /
        if (prefix.endsWith("/")) {
            prefix = prefix.substring(0, prefix.length() - 1);
        }
        String key = objectKey.startsWith("/") ? objectKey.substring(1) : objectKey;
        return prefix + "/" + key;
    }

    /**
     * 从完整 URL 中解析出 OSS 对象键（含 dir 前缀）
     * 支持两种输入：
     * 1. 完整 URL: https://bucket.oss-cn-hz.aliyuncs.com/posts/2026/08/x.md → posts/2026/08/x.md
     * 2. 相对路径: posts/2026/08/x.md → posts/2026/08/x.md
     */
    private String extractObjectKey(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return null;
        try {
            if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
                URL url = new URL(fileUrl);
                // path 开头有 /，去掉
                String path = url.getPath();
                return path.startsWith("/") ? path.substring(1) : path;
            } else {
                return fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            }
        } catch (Exception e) {
            log.warn("[OssService] 无法解析 OSS URL: {}", fileUrl, e);
            return null;
        }
    }
}
