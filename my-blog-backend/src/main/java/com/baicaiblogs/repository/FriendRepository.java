package com.baicaiblogs.repository;

import com.baicaiblogs.entity.Friend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRepository extends JpaRepository<Friend, Long> {
    Optional<Friend> findByFriendId(String friendId);
    void deleteByFriendId(String friendId);
    boolean existsByFriendId(String friendId);
    List<Friend> findAllByOrderBySortOrderAsc();
}
