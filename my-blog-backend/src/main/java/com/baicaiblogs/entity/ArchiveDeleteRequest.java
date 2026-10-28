package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "archive_delete_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchiveDeleteRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "archive_id", nullable = false)
    private Long archiveId;

    @Column(name = "requested_by", nullable = false)
    private Long requestedBy;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_note", length = 1000)
    private String reviewNote;
}
