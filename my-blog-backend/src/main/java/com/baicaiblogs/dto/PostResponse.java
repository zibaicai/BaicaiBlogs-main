package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private String slug;
    private String title;
    private String description;
    private String content;
    private String htmlContent;
    private String cover;
    private LocalDateTime date;
    private String status;
    private Integer views;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
