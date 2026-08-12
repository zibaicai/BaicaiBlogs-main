package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Friend;
import com.baicaiblogs.repository.FriendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;

    @Transactional(readOnly = true)
    public List<FriendResponse> getAllFriends() {
        return friendRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FriendResponse createFriend(FriendRequest request) {
        if (friendRepository.existsByFriendId(request.getFriendId())) {
            throw new RuntimeException("Friend ID 已存在: " + request.getFriendId());
        }

        Friend friend = Friend.builder()
                .friendId(request.getFriendId())
                .name(request.getName())
                .url(request.getUrl())
                .description(request.getDescription())
                .avatar(request.getAvatar())
                .themeColor(request.getThemeColor())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        return toResponse(friendRepository.save(friend));
    }

    @Transactional
    public FriendResponse updateFriend(String friendId, FriendRequest request) {
        Friend friend = friendRepository.findByFriendId(friendId)
                .orElseThrow(() -> new RuntimeException("友链不存在: " + friendId));

        friend.setName(request.getName());
        friend.setUrl(request.getUrl());
        friend.setDescription(request.getDescription());
        friend.setAvatar(request.getAvatar());
        friend.setThemeColor(request.getThemeColor());
        if (request.getSortOrder() != null) {
            friend.setSortOrder(request.getSortOrder());
        }

        return toResponse(friendRepository.save(friend));
    }

    @Transactional
    public void deleteFriend(String friendId) {
        if (!friendRepository.existsByFriendId(friendId)) {
            throw new RuntimeException("友链不存在: " + friendId);
        }
        friendRepository.deleteByFriendId(friendId);
    }

    private FriendResponse toResponse(Friend friend) {
        return FriendResponse.builder()
                .id(friend.getId())
                .friendId(friend.getFriendId())
                .name(friend.getName())
                .url(friend.getUrl())
                .description(friend.getDescription())
                .avatar(friend.getAvatar())
                .themeColor(friend.getThemeColor())
                .sortOrder(friend.getSortOrder())
                .build();
    }
}
