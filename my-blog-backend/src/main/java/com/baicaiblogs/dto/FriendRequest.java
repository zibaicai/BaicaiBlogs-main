package com.baicaiblogs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequest {
    private String friendId;
    private String name;
    private String url;
    private String description;
    private String avatar;
    private String themeColor;
    private Integer sortOrder;
}
