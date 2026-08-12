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
public class ChatterRequest {
    private String slug;
    private String title;
    private String content;
    private String mood;
    private String cover;
    private LocalDateTime date;
    private List<String> tags;
}
