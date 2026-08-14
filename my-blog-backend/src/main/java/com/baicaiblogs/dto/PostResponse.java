package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    /** URL 友好的唯一标识 */
    private String slug;
    private String title;
    private String description;
    /** Markdown 原文 */
    private String content;
    /** 渲染后的 HTML */
    private String htmlContent;
    private String cover;
    private LocalDateTime date;
    private String status;
    private Integer views;
    /** 标签列表 */
    private List<String> tags;
    /** MD 原文件在阿里云 OSS 上的完整 URL（公开访问），前端可直接下载原始 MD */
    private String fileUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
