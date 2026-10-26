package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "music_playlist_applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicPlaylistApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "applicant_id", nullable = false)
    private Long applicantId;

    @Column(nullable = false, length = 30)
    private String platform;

    @Column(name = "external_playlist_id", nullable = false, length = 120)
    private String externalPlaylistId;

    @Column(length = 300)
    private String title;

    @Column(length = 500)
    private String cover;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** PENDING / APPROVED / REJECTED */
    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
