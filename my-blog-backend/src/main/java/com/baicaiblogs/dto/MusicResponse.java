package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicResponse {
    private String id;
    private String name;
    private String artist;
    private String author;
    private String cover;
    private String pic;
    private String url;
    private String lrc;
    private String error;
}
