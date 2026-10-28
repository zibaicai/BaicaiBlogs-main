package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "archive_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchiveDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_url", nullable = false, length = 1000)
    private String sourceUrl;

    @Column(name = "canonical_url", length = 1000)
    private String canonicalUrl;

    @Column(name = "source_url_hash", nullable = false, unique = true, length = 64)
    private String sourceUrlHash;

    @Column(name = "source_title", nullable = false, length = 500)
    private String sourceTitle;

    @Column(name = "source_author", length = 255)
    private String sourceAuthor;

    @Column(name = "source_site", length = 255)
    private String sourceSite;

    @Column(name = "source_published_at", length = 80)
    private String sourcePublishedAt;

    @Column(name = "imported_at", nullable = false)
    private LocalDateTime importedAt;

    @Column(name = "imported_by", nullable = false)
    private Long importedBy;

    @Column(name = "content_html", columnDefinition = "LONGTEXT", nullable = false)
    private String contentHtml;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "copyright_note", length = 1000)
    private String copyrightNote;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
