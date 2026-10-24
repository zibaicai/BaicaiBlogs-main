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
@Table(name = "moments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Moment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 200)
    private String slug;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(name = "html_content", columnDefinition = "MEDIUMTEXT")
    private String htmlContent;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(columnDefinition = "JSON")
    private String images;

    @Column(name = "user_id")
    private Long userId;

    /** DRAFT / PUBLISHED */
    @Column(length = 16, nullable = false)
    @Builder.Default
    private String status = "PUBLISHED";

    /** PUBLIC / PRIVATE */
    @Column(length = 16, nullable = false)
    @Builder.Default
    private String visibility = "PUBLIC";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
