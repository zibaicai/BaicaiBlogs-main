package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "suggestion_images", indexes = {
        @Index(name = "idx_suggestion_image_owner", columnList = "user_id,created_at"),
        @Index(name = "idx_suggestion_image_suggestion", columnList = "suggestion_id,sort_order")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "suggestion_id")
    private Long suggestionId;

    @Column(name = "object_key", nullable = false, length = 500)
    private String objectKey;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "bytes", nullable = false)
    private Long bytes;

    private Integer width;

    private Integer height;

    @Column(length = 100)
    private String sha256;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /** TEMP / ATTACHED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "TEMP";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
