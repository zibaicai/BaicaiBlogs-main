package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_presence")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPresence {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "last_seen_at", nullable = false)
    private LocalDateTime lastSeenAt;

    @Column(name = "last_path", length = 500)
    private String lastPath;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
