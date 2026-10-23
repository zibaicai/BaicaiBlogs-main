package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, Long> {
    List<Appeal> findAllByOrderByCreatedAtDesc();
}
