package com.baicaiblogs.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "private_moment_audits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivateMomentAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "moment_id", nullable = false)
    private Long momentId;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(length = 64)
    private String ip;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
