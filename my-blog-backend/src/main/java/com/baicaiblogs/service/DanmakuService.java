package com.baicaiblogs.service;

import com.baicaiblogs.dto.DanmakuResponse;
import com.baicaiblogs.entity.DanmakuMessage;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.DanmakuMessageRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DanmakuService {

    public static final int MAX_MESSAGES = 1000;
    public static final int MAX_LENGTH = 100;
    private static final int RATE_LIMIT_PER_MINUTE = 5;

    private final DanmakuMessageRepository repository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<String> publicList() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .limit(1000)
                .map(DanmakuMessage::getText)
                .toList();
    }

    @Transactional
    public DanmakuMessage add(User user, String rawText, String ipHash) {
        String text = rawText == null ? "" : rawText.trim();
        if (text.isEmpty()) throw new RuntimeException("弹幕内容不能为空");
        if (text.length() > MAX_LENGTH) throw new RuntimeException("弹幕不能超过 100 个字");
        if (repository.countByUserIdAndCreatedAtAfter(user.getId(), LocalDateTime.now().minusMinutes(1))
                >= RATE_LIMIT_PER_MINUTE) {
            throw new RuntimeException("发送太频繁，请稍后再试");
        }

        while (repository.count() >= MAX_MESSAGES) {
            repository.findFirstByOrderByCreatedAtAscIdAsc().ifPresent(repository::delete);
        }

        return repository.save(DanmakuMessage.builder()
                .userId(user.getId())
                .text(text)
                .ipHash(ipHash)
                .build());
    }

    @Transactional(readOnly = true)
    public List<DanmakuResponse> adminList() {
        List<DanmakuMessage> messages = repository.findAllByOrderByCreatedAtDesc();
        List<Long> userIds = messages.stream().map(DanmakuMessage::getUserId)
                .filter(id -> id != null).distinct().toList();
        Map<Long, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return messages.stream().map(m -> {
            User user = m.getUserId() == null ? null : users.get(m.getUserId());
            return DanmakuResponse.builder()
                    .id(m.getId())
                    .userId(m.getUserId())
                    .username(user == null ? null : user.getUsername())
                    .text(m.getText())
                    .ipHash(m.getIpHash())
                    .createdAt(m.getCreatedAt())
                    .build();
        }).toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) throw new RuntimeException("弹幕不存在");
        repository.deleteById(id);
    }
}
