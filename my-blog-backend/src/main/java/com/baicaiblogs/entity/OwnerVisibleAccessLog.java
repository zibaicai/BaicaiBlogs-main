package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "owner_visible_access_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerVisibleAccessLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "album_id", nullable = false)
    private Long albumId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "admin_label", length = 100)
    private String adminLabel;

    @Column(length = 30)
    private String action;

    @Column(name = "grant_id")
    private Long grantId;

    @CreationTimestamp
    @Column(name = "viewed_at", updatable = false)
    private LocalDateTime viewedAt;
}
