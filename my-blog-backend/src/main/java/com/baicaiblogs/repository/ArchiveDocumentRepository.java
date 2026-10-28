package com.baicaiblogs.repository;

import com.baicaiblogs.entity.ArchiveDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArchiveDocumentRepository extends JpaRepository<ArchiveDocument, Long> {
    Optional<ArchiveDocument> findBySourceUrlHash(String sourceUrlHash);
    List<ArchiveDocument> findAllByOrderByImportedAtDesc();
}
