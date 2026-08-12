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
public class AlbumRequest {
    private String albumId;
    private String title;
    private String description;
    private String cover;
    private LocalDateTime date;
    private Integer sortOrder;
    private List<PhotoRequest> photos;
}
