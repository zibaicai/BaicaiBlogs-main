package com.baicaiblogs.repository;

import com.baicaiblogs.entity.TrafficLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrafficLedgerRepository extends JpaRepository<TrafficLedger, Long> {
}
