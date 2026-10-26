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
public class CommentResponse {
    private Long id;
    private String targetType;
    private Long targetId;
    private Long userId;
    private String author;
    private String avatar;
    private String content;
    private String status;
    private LocalDateTime createdAt;
    private long likeCount;
    private long dislikeCount;
    private String myReaction;
    private boolean canDelete;
    private boolean canReport;
}
