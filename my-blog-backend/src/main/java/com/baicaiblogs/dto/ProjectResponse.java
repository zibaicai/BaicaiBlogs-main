package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private String projectId;
    private String name;
    private String description;
    private String icon;
    private String githubUrl;
    private List<String> tags;
    private Integer sortOrder;
}
