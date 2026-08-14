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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
