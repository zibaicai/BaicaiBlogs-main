package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "albums")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "album_id", unique = true, nullable = false, length = 100)
    private String albumId;

    /** 所有者；管理员创建的公共相册可为空 */
    @Column(name = "user_id")
    private Long userId;

    /** 预留多级文件夹，当前只做一层 */
    @Column(name = "parent_id")
    private Long parentId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String cover;

    private LocalDateTime date;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    /** PUBLIC / PASSWORD / PRIVATE */
    @Column(length = 20)
    @Builder.Default
    private String visibility = "PUBLIC";

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /** VISIBLE / HIDDEN_PENDING_REVIEW / HIDDEN */
    @Column(length = 30)
    @Builder.Default
    private String status = "VISIBLE";

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 0;

    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Photo> photos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
