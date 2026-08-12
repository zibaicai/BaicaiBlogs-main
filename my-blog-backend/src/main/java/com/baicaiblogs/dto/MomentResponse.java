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
public class MomentResponse {
    private Long id;
    private String slug;
    private String content;
    private String htmlContent;
    private LocalDateTime date;
    private List<String> images;
    private LocalDateTime createdAt;
}
