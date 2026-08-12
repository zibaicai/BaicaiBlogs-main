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
    private Long postId;
    private Long chatterId;
    private Long momentId;
    private String author;
    private String email;
    private String content;
    private String avatar;
    private String status;
    private LocalDateTime createdAt;
}
