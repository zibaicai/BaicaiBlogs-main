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
public class PostRequest {
    /** URL 友好的唯一标识，例如 my-first-post */
    private String slug;
    /** 文章标题 */
    private String title;
    /** 文章摘要/描述 */
    private String description;
    /** Markdown 原文 */
    private String content;
    /** 封面图 URL */
    private String cover;
    /** 发布时间 */
    private LocalDateTime date;
    /** 文章状态：PUBLISHED / DRAFT */
    private String status;
    /** 标签列表，例如 ["React","Spring Boot"] */
    private List<String> tags;
}
