package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ArticleDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArticleRequest {
        private String title;
        private String subtitle;
        private String cover;
        private String summary;
        private String contentHtml;
        private String category;
        private List<String> tags;
        private String status;
        private String visibility;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArticleResponse {
        private Long id;
        private Long userId;
        private String author;
        private String slug;
        private String title;
        private String subtitle;
        private String cover;
        private String summary;
        private String contentHtml;
        private String contentText;
        private String category;
        private List<String> tags;
        private String status;
        private String visibility;
        private Integer readingTime;
        private LocalDateTime publishedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
