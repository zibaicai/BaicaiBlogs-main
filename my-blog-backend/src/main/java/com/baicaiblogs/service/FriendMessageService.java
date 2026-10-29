package com.baicaiblogs.service;

import com.baicaiblogs.entity.Friend;
import com.baicaiblogs.entity.FriendMessage;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.FriendMessageRepository;
import com.baicaiblogs.repository.FriendRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FriendMessageService {

    private final FriendMessageRepository messageRepository;
    private final FriendRepository friendRepository;
    private final TurnstileService turnstileService;

    @Transactional
    public Map<String, Object> submit(Map<String, String> body, String ip, String userAgent) {
        turnstileService.verify(body.get("turnstileToken"), ip);
        String name = optional(body.get("name"), 100);
        if (name == null) name = "匿名";
        String content = required(body.get("content"), "留言内容", 500);
        String website = optionalUrl(body.get("website"), 500);
        String avatar = optionalUrl(body.get("avatar"), 500);
        String contact = optional(body.get("contact"), 500);
        String ipHash = ip == null || ip.isBlank() ? null : IpBanService.hash(ip);

        if (ipHash != null) {
            if (messageRepository.countByIpHashAndCreatedAtAfter(ipHash, LocalDateTime.now().minusDays(1)) >= 5) {
                throw new RuntimeException("今天留言次数过多，请明天再试");
            }
            if (messageRepository.existsByIpHashAndContentAndCreatedAtAfter(ipHash, content, LocalDateTime.now().minusHours(1))) {
                throw new RuntimeException("请勿重复提交相同留言");
            }
        }

        FriendMessage message = messageRepository.save(FriendMessage.builder()
                .name(name)
                .website(website)
                .avatar(avatar)
                .content(content)
                .contact(contact)
                .status("VISIBLE")
                .ipHash(ipHash)
                .userAgent(optional(userAgent, 500))
                .build());
        return publicMap(message);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> publicMessages() {
        return messageRepository.findByStatusOrderByCreatedAtDesc("VISIBLE").stream()
                .map(this::publicMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> pendingMessages() {
        return messageRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::adminMap)
                .toList();
    }

    @Transactional
    public void approve(Long id, User reviewer) {
        FriendMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("留言不存在"));
        message.setStatus("VISIBLE");
        message.setReviewedBy(reviewer.getId());
        message.setReviewedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    @Transactional
    public void reject(Long id, User reviewer, String note) {
        FriendMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("留言不存在"));
        message.setStatus("HIDDEN");
        message.setReviewedBy(reviewer.getId());
        message.setReviewedAt(LocalDateTime.now());
        message.setReviewNote(optional(note, 1000));
        messageRepository.save(message);
    }

    @Transactional
    public void delete(Long id) {
        if (!messageRepository.existsById(id)) throw new RuntimeException("留言不存在");
        messageRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> promote(Long id, User reviewer) {
        FriendMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("留言不存在"));
        String website = message.getWebsite();
        if (website == null || website.isBlank()) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern
                    .compile("https?://[^\\s<>\"']+")
                    .matcher(message.getContent());
            if (matcher.find()) website = matcher.group();
        }
        if (website == null || website.isBlank()) throw new RuntimeException("留言中没有可收录的网站地址");
        String friendId = "message-" + message.getId();
        while (friendRepository.existsByFriendId(friendId)) friendId += "-x";
        Friend friend = friendRepository.save(Friend.builder()
                .friendId(friendId)
                .name(message.getName())
                .url(website)
                .description(message.getContent())
                .avatar(message.getAvatar())
                .sortOrder(friendRepository.findAllByOrderBySortOrderAsc().size())
                .build());
        message.setStatus("VISIBLE");
        message.setFriendId(friend.getFriendId());
        message.setReviewedBy(reviewer.getId());
        message.setReviewedAt(LocalDateTime.now());
        messageRepository.save(message);
        return adminMap(message);
    }

    private Map<String, Object> publicMap(FriendMessage message) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", message.getId());
        out.put("name", message.getName());
        out.put("website", message.getWebsite());
        out.put("avatar", message.getAvatar());
        out.put("content", message.getContent());
        out.put("status", message.getStatus());
        out.put("createdAt", message.getCreatedAt());
        return out;
    }

    private Map<String, Object> adminMap(FriendMessage message) {
        Map<String, Object> out = publicMap(message);
        out.put("status", message.getStatus());
        out.put("contact", message.getContact());
        out.put("ipHash", message.getIpHash());
        out.put("userAgent", message.getUserAgent());
        out.put("friendId", message.getFriendId());
        out.put("reviewNote", message.getReviewNote());
        return out;
    }

    private String required(String value, String label, int max) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) throw new RuntimeException(label + "不能为空");
        return optional(normalized, max);
    }

    private String optional(String value, int max) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isEmpty()) return null;
        return normalized.length() > max ? normalized.substring(0, max) : normalized;
    }

    private String optionalUrl(String value, int max) {
        String url = optional(value, max);
        if (url == null) return null;
        try {
            URI uri = URI.create(url);
            if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new RuntimeException("网址只支持 http / https");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) throw new RuntimeException("网址格式不正确");
            return uri.toString();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("网址格式不正确");
        }
    }
}
