package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ip_bans", indexes = {@Index(name = "idx_ipban_hash", columnList = "ip_hash")})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpBan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_hash", nullable = false, length = 100)
    private String ipHash;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
