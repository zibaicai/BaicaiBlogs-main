package com.baicaiblogs.dto;

import com.baicaiblogs.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String category;
    private String title;
    private String body;
    private String targetType;
    private Long targetId;
    private String link;
    private Long actorId;
    private String actorName;
    private String actorAvatar;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .category(notification.getCategory())
                .title(notification.getTitle())
                .body(notification.getBody())
                .targetType(notification.getTargetType())
                .targetId(notification.getTargetId())
                .link(notification.getLink())
                .actorId(notification.getActorId())
                .actorName(notification.getActorName())
                .actorAvatar(notification.getActorAvatar())
                .read(Boolean.TRUE.equals(notification.getRead()))
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
