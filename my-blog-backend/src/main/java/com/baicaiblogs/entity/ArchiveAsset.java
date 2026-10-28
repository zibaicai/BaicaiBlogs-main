package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "archive_assets", uniqueConstraints = {
        @UniqueConstraint(name = "uk_archive_asset_source", columnNames = {"archive_id", "source_url_hash"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchiveAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "archive_id", nullable = false)
    private Long archiveId;

    @Column(name = "source_url", nullable = false, length = 1000)
    private String sourceUrl;

    @Column(name = "source_url_hash", nullable = false, length = 64)
    private String sourceUrlHash;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /** Private OSS object key; null when the database fallback is used. */
    @Column(name = "storage_key", length = 500)
    private String storageKey;

    /** Database fallback bytes. */
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] data;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "sha256", nullable = false, length = 64)
    private String sha256;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
