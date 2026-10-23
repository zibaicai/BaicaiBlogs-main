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
public class PhotoResponse {
    private Long id;
    private Long albumId;
    private String url;
    private String thumbUrl;
    private String standardUrl;
    private String originalUrl;
    private String caption;
    private Integer sortOrder;
    private Integer weight;
    private Integer width;
    private Integer height;
    private Long bytes;
    private String mime;
    private String status;
    private Integer reportCount;
    private LocalDateTime createdAt;
}
