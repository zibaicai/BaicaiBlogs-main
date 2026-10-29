package com.baicaiblogs.service;

import com.baicaiblogs.entity.Album;
import com.baicaiblogs.entity.Moment;
import com.baicaiblogs.entity.Post;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.AlbumRepository;
import com.baicaiblogs.repository.MomentRepository;
import com.baicaiblogs.repository.PostRepository;
import com.baicaiblogs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final MomentRepository momentRepository;
    private final AlbumRepository albumRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listRooms() {
        return userRepository.findAll().stream()
                .filter(user -> "ACTIVE".equalsIgnoreCase(user.getStatus()))
                .map(user -> profile(user, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRoom(String username) {
        User user = userRepository.findByUsername(username)
                .filter(value -> "ACTIVE".equalsIgnoreCase(value.getStatus()))
                .orElseThrow(() -> new RuntimeException("小屋不存在"));
        return profile(user, true);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> myRoom(User user) {
        return profile(user, false);
    }

    @Transactional
    public Map<String, Object> updateRoom(User user, Map<String, String> body) {
        if (body.get("nickname") != null) {
            String nickname = body.get("nickname").trim();
            if (nickname.isBlank()) throw new RuntimeException("昵称不能为空");
            user.setNickname(limit(nickname, 50));
        }
        if (body.get("roomName") != null) {
            String roomName = body.get("roomName").trim();
            user.setRoomName(roomName.isBlank() ? null : limit(roomName, 80));
        }
        if (body.get("roomBio") != null) {
            user.setRoomBio(body.get("roomBio").trim().isEmpty() ? null : limit(body.get("roomBio").trim(), 500));
        }
        if (body.get("avatar") != null) {
            String avatar = body.get("avatar").trim();
            if (!avatar.isEmpty() && !(avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/"))) {
                throw new RuntimeException("头像地址格式不正确");
            }
            user.setAvatar(avatar.isEmpty() ? null : limit(avatar, 500));
        }
        userRepository.save(user);
        return profile(user, false);
    }

    private Map<String, Object> profile(User user, boolean includeContent) {
        String nickname = user.getNickname() == null || user.getNickname().isBlank()
                ? user.getUsername()
                : user.getNickname();
        String roomName = user.getRoomName() == null || user.getRoomName().isBlank()
                ? nickname + "的小屋"
                : user.getRoomName();
        List<Post> posts = postRepository.findPublishedPublicByUserId(user.getId());
        List<Moment> moments = momentRepository.findPublishedPublicByUserId(user.getId());
        List<Album> albums = albumRepository.findByUserIdOrderBySortOrderAsc(user.getId());
        int photoCount = albums.stream().mapToInt(album -> album.getPhotos() == null ? 0 : album.getPhotos().size()).sum();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", user.getId());
        out.put("username", user.getUsername());
        out.put("nickname", nickname);
        out.put("roomName", roomName);
        out.put("roomBio", user.getRoomBio() == null ? "" : user.getRoomBio());
        out.put("avatar", user.getAvatar() == null ? "" : user.getAvatar());
        out.put("joinedAt", user.getCreatedAt());
        out.put("postCount", posts.size());
        out.put("momentCount", moments.size());
        out.put("albumCount", albums.size());
        out.put("photoCount", photoCount);
        if (includeContent) {
            out.put("posts", posts.stream().limit(12).map(this::postMap).toList());
            out.put("moments", moments.stream().limit(12).map(this::momentMap).toList());
        }
        return out;
    }

    private Map<String, Object> postMap(Post post) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", post.getId());
        out.put("slug", post.getSlug());
        out.put("title", post.getTitle());
        out.put("description", post.getDescription());
        out.put("cover", post.getCover());
        out.put("date", post.getDate());
        out.put("views", post.getViews());
        return out;
    }

    private Map<String, Object> momentMap(Moment moment) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", moment.getId());
        out.put("slug", moment.getSlug());
        out.put("content", moment.getContent());
        out.put("htmlContent", moment.getHtmlContent());
        out.put("images", moment.getImages());
        out.put("date", moment.getDate());
        return out;
    }

    private String limit(String value, int max) {
        return value.length() <= max ? value : value.substring(0, max);
    }
}
