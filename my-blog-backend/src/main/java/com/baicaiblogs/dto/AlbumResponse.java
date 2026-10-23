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
public class AlbumResponse {
    private Long id;
    private String albumId;
    private Long userId;
    private Long parentId;
    private String title;
    private String description;
    private String cover;
    private LocalDateTime date;
    private Integer sortOrder;
    private String visibility;
    private Boolean hasPassword;
    private String status;
    private Integer reportCount;
    private Long photoCount;
    private String coverThumbUrl;
    private String coverStandardUrl;
    private List<PhotoResponse> photos;
}
