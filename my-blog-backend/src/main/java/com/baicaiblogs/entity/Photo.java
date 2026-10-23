package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    /** OSS 对象键，例如 photos/2026/10/xxx.webp */
    @Column(name = "object_key", length = 500)
    private String objectKey;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 500)
    private String caption;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    /** 权重越大越靠前，封面取最大值 */
    @Column(name = "weight")
    @Builder.Default
    private Integer weight = 0;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "bytes")
    private Long bytes;

    @Column(length = 100)
    private String mime;

    /** 原图 SHA-256，用于去重/证据 */
    @Column(length = 100)
    private String hash;

    /** VISIBLE / HIDDEN_PENDING_REVIEW / HIDDEN */
    @Column(length = 30)
    @Builder.Default
    private String status = "VISIBLE";

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
