package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SuggestionDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestionRequest {
        private String title;
        private String category;
        private String content;
        private List<Long> imageIds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewRequest {
        private String status;
        private Integer score;
        private BigDecimal rewardAmount;
        private String reviewNote;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageDto {
        private Long id;
        private Integer width;
        private Integer height;
        private Long bytes;
        private String contentType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SuggestionResponse {
        private Long id;
        private Long userId;
        private String author;
        private String title;
        private String category;
        private String content;
        private String status;
        private Integer score;
        private BigDecimal rewardAmount;
        private String rewardStatus;
        private String reviewNote;
        private List<ImageDto> images;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
