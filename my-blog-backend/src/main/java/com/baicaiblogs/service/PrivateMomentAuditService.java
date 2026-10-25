package com.baicaiblogs.service;

import com.baicaiblogs.entity.Moment;
import com.baicaiblogs.entity.PrivateMomentAudit;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.MomentRepository;
import com.baicaiblogs.repository.PrivateMomentAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PrivateMomentAuditService {

    private final MomentRepository momentRepository;
    private final PrivateMomentAuditRepository auditRepository;

    @Transactional(readOnly = true)
    public List<Moment> listPrivate() {
        return momentRepository.findByVisibilityOrderByDateDesc("PRIVATE");
    }

    @Transactional
    public void record(User operator, Moment moment, String reason, String ip) {
        auditRepository.save(PrivateMomentAudit.builder()
                .momentId(moment.getId())
                .operatorId(operator.getId())
                .reason(reason == null || reason.isBlank() ? "未填写原因" : reason)
                .ip(ip)
                .build());
    }
}
