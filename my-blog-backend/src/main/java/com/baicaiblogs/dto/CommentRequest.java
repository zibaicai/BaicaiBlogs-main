package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    private Long postId;
    private Long chatterId;
    private Long momentId;
    private String author;
    private String email;
    private String content;
    private String avatar;
}
