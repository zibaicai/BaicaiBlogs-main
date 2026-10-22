package com.baicaiblogs.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import com.aliyun.oss.model.PutObjectResult;
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
