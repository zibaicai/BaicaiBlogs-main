package com.baicaiblogs.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里云 OSS 配置属性
 * 从 application.yml 的 app.oss 节点读取
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.oss")
public class OssProperties {
    /** OSS Endpoint，例如 oss-cn-hangzhou.aliyuncs.com */
    private String endpoint;
    /** 阿里云 AccessKeyId */
    private String accessKeyId;
    /** 阿里云 AccessKeySecret */
    private String accessKeySecret;
    /** Bucket 名称 */
    private String bucketName;
    /** 公开访问域名前缀，例如 https://xxx.oss-cn-hz.aliyuncs.com，用于拼接返回前端的 URL */
    private String publicUrlPrefix;
    /** 存储目录前缀，例如 posts/（结尾带 /） */
    private String dir = "posts/";

    /**
     * 检查 OSS 配置是否已填写（占位符未替换则跳过 OSS 上传）
     * 当 endpoint 或 bucket 仍为占位符时返回 false
     */
    public boolean isConfigured() {
        return endpoint != null
                && !endpoint.contains("your-")
                && accessKeyId != null
                && !accessKeyId.contains("your-")
                && accessKeySecret != null
                && !accessKeySecret.contains("your-")
                && bucketName != null
                && !bucketName.contains("your-")
                && publicUrlPrefix != null
                && !publicUrlPrefix.contains("your-");
    }
}
