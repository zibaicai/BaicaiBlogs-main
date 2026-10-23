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
public class DanmakuResponse {
    private Long id;
    private Long userId;
    private String username;
    private String text;
    private String ipHash;
    private LocalDateTime createdAt;
}
