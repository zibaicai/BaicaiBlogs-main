package com.baicaiblogs.repository;

import com.baicaiblogs.entity.IpBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IpBanRepository extends JpaRepository<IpBan, Long> {
    java.util.Optional<IpBan> findByIpHash(String ipHash);
    boolean existsByIpHash(String ipHash);
}
