package com.baicaiblogs.repository;

import com.baicaiblogs.entity.ArchiveAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArchiveAssetRepository extends JpaRepository<ArchiveAsset, Long> {
    List<ArchiveAsset> findByArchiveId(Long archiveId);
    void deleteByArchiveId(Long archiveId);
}
