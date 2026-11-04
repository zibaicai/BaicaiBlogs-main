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
public class CommentThreadPage {
    private List<CommentResponse> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
}
