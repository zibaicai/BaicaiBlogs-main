package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "album_unlock_attempts",
        uniqueConstraints = @UniqueConstraint(name = "uk_album_scope_subject", columnNames = {"album_id", "scope", "subject"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumUnlockAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "album_id", nullable = false)
    private Long albumId;

    /** USER / IP */
    @Column(length = 10, nullable = false)
    private String scope;

    @Column(length = 100, nullable = false)
    private String subject;

    @Column(name = "fail_count")
    @Builder.Default
    private Integer failCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
