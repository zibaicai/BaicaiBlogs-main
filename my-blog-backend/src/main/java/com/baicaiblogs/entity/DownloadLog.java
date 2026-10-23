package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "photo_downloads", indexes = {
        @Index(name = "idx_download_user_photo_time", columnList = "user_id,photo_id,created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "photo_id", nullable = false)
    private Long photoId;

    /** view / download */
    @Column(length = 20)
    private String action;

    @Column(name = "bytes")
    private Long bytes;

    @Column(name = "ip_hash", length = 100)
    private String ipHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
