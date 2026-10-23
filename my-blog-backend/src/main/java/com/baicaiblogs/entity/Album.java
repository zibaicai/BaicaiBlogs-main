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

    /** 内容版本：照片/标题/描述/封面/可见性/密码/展示设置变更时递增 */
    @Column(name = "content_version")
    @Builder.Default
    private Long contentVersion = 0L;

    /** 低分辨率模糊封面对象 key，密码相册锁定态只返回它 */
    @Column(name = "cover_blur_key", length = 500)
    private String coverBlurKey;

    /** 是否隐藏照片数量，默认 false（显示） */
    @Column(name = "hide_photo_count")
    @Builder.Default
    private Boolean hidePhotoCount = false;

    /** owner 已收到通知的内容版本，用于每版本首次通知 */
    @Column(name = "owner_notified_version")
    @Builder.Default
    private Long ownerNotifiedVersion = -1L;

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
