package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "registration_audits", indexes = {
        @Index(name = "idx_registration_audit_ip", columnList = "ip_hash,created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_hash", nullable = false, length = 100)
    private String ipHash;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 100)
    private String username;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
