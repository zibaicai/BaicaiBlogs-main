package com.baicaiblogs.service;

import com.baicaiblogs.entity.MusicPlaylist;
import com.baicaiblogs.entity.MusicPlaylistTrack;
import com.baicaiblogs.entity.MusicTrack;
import com.baicaiblogs.entity.User;
import com.baicaiblogs.repository.MusicPlaylistRepository;
import com.baicaiblogs.repository.MusicPlaylistTrackRepository;
import com.baicaiblogs.repository.MusicTrackRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Imports a public NetEase playlist into the local curated library.
 * Only public playlist metadata is read; no user token or uct2 is stored.
 */
@Service
@RequiredArgsConstructor
public class MusicPlaylistImportService {

    private static final Pattern PLAYLIST_ID = Pattern.compile("(?:[?&#]id=|/playlist/)(\\d+)");
    private static final Pattern NUMERIC_ID = Pattern.compile("\\d+");
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final MusicTrackRepository trackRepository;
    private final MusicPlaylistRepository playlistRepository;
    private final MusicPlaylistTrackRepository playlistTrackRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public MusicPlaylist importPublicPlaylist(String rawPlaylistId, User admin) {
        String playlistId = normalizePlaylistId(rawPlaylistId);
        JsonNode root = fetchPlaylist(playlistId);
        JsonNode playlistNode = root.path("playlist");
        if (playlistNode.isMissingNode() || playlistNode.isNull()) {
            throw new RuntimeException("网易云歌单不存在或未公开");
        }

        String title = text(playlistNode, "name", "网易云歌单");
        String cover = text(playlistNode, "coverImgUrl", null);
        String description = text(playlistNode, "description", null);
        List<JsonNode> tracks = loadTracks(playlistNode);
        if (tracks.isEmpty()) {
            throw new RuntimeException("该歌单没有可导入的歌曲");
        }

        MusicPlaylist playlist = playlistRepository
                .findByPlatformAndExternalPlaylistIdAndType("netease", playlistId, "CURATED")
                .orElseGet(() -> MusicPlaylist.builder()
                        .platform("netease")
                        .externalPlaylistId(playlistId)
                        .type("CURATED")
                        .visibility("PUBLIC")
                        .status("ACTIVE")
                        .recommenderName(displayName(admin))
                        .build());

        playlist.setTitle(limit(title, 300));
        playlist.setCover(limit(cover, 500));
        playlist.setDescription(description);
        playlist.setStatus("ACTIVE");
        playlist.setVisibility("PUBLIC");
        if (playlist.getSlug() == null || playlist.getSlug().isBlank()) {
            playlist.setSlug(uniqueSlug(title, playlistId));
        }
        playlist = playlistRepository.save(playlist);

        playlistTrackRepository.deleteByPlaylistId(playlist.getId());
        playlistTrackRepository.flush();
        Set<Long> importedTrackIds = new LinkedHashSet<>();
        int position = 0;
        for (JsonNode trackNode : tracks) {
            MusicTrack track = upsertTrack(trackNode);
            if (track == null || !importedTrackIds.add(track.getId())) continue;
            playlistTrackRepository.save(MusicPlaylistTrack.builder()
                    .playlistId(playlist.getId())
                    .trackId(track.getId())
                    .position(position++)
                    .build());
        }
        if (position == 0) {
            throw new RuntimeException("该歌单没有可导入的歌曲");
        }
        playlist.setTrackCount(position);
        return playlistRepository.save(playlist);
    }

    private List<JsonNode> loadTracks(JsonNode playlistNode) {
        JsonNode inlineTracks = playlistNode.path("tracks");
        JsonNode trackIds = playlistNode.path("trackIds");
        List<String> ids = new ArrayList<>();
        if (trackIds.isArray()) {
            for (JsonNode item : trackIds) {
                String id = item.path("id").asText("");
                if (!id.isBlank()) ids.add(id);
            }
        }
        if (ids.size() > inlineTracks.size()) {
            Map<String, JsonNode> fetched = fetchSongs(ids);
            List<JsonNode> ordered = new ArrayList<>();
            for (String id : ids) {
                JsonNode song = fetched.get(id);
                if (song != null) ordered.add(song);
            }
            if (ordered.size() < ids.size()) {
                List<JsonNode> fallback = fetchMetingTracks(playlistNode.path("id").asText());
                if (fallback.size() > ordered.size()) return fallback;
            }
            if (!ordered.isEmpty()) return ordered;
        }
        List<JsonNode> tracks = new ArrayList<>();
        if (inlineTracks.isArray()) {
            for (JsonNode track : inlineTracks) tracks.add(track);
        }
        return tracks;
    }

    private List<JsonNode> fetchMetingTracks(String playlistId) {
        List<JsonNode> result = new ArrayList<>();
        if (playlistId == null || playlistId.isBlank()) return result;
        try {
            HttpRequest request = HttpRequest.newBuilder(
                            URI.create("https://api.injahow.cn/meting/?type=playlist&id=" + playlistId))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "Mozilla/5.0 (compatible; BaicaiMusic/1.0)")
                    .GET()
                    .build();
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return result;
            JsonNode array = objectMapper.readTree(response.body());
            if (!array.isArray()) return result;
            for (JsonNode item : array) {
                String name = item.path("name").asText("");
                String url = item.path("url").asText("");
                Matcher matcher = Pattern.compile("[?&]id=(\\d+)").matcher(url);
                if (name.isBlank() || !matcher.find()) continue;
                String externalId = matcher.group(1);
                var song = objectMapper.createObjectNode();
                song.put("id", externalId);
                song.put("name", name);
                song.put("dt", 0);
                var artists = song.putArray("ar");
                String artist = item.path("artist").asText("");
                if (!artist.isBlank()) {
                    for (String part : artist.split("\\s*/\\s*")) {
                        artists.addObject().put("name", part);
                    }
                }
                var album = song.putObject("al");
                album.put("picUrl", item.path("pic").asText(""));
                result.add(song);
            }
        } catch (Exception ignored) {
            // Import can still fall back to the ten inline NetEase tracks.
        }
        return result;
    }

    private Map<String, JsonNode> fetchSongs(List<String> ids) {        Map<String, JsonNode> result = new LinkedHashMap<>();
        for (int start = 0; start < ids.size(); start += 200) {
            List<String> chunk = ids.subList(start, Math.min(start + 200, ids.size()));
            try {
                String encoded = URLEncoder.encode(objectMapper.writeValueAsString(chunk), StandardCharsets.UTF_8);
                HttpRequest request = HttpRequest.newBuilder(
                                URI.create("https://music.163.com/api/song/detail?ids=" + encoded))
                        .timeout(Duration.ofSeconds(25))
                        .header("User-Agent", "Mozilla/5.0 (compatible; BaicaiMusic/1.0)")
                        .header("Referer", "https://music.163.com/")
                        .header("Cookie", "os=pc; appver=8.10.90; osver=Microsoft-Windows-10-Professional-build-19045-64bit; channel=netease; __remember_me=true")
                        .GET()
                        .build();
                HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() != 200) continue;
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode songs = root.path("songs");
                if (!songs.isArray()) continue;
                for (JsonNode song : songs) {
                    String id = song.path("id").asText("");
                    if (!id.isBlank()) result.put(id, song);
                }
            } catch (Exception ignored) {
                // Keep the inline tracks if the batch endpoint is unavailable.
            }
        }
        return result;
    }

    private JsonNode fetchPlaylist(String playlistId) {        String url = "https://music.163.com/api/v6/playlist/detail?id=" + playlistId;
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("User-Agent", "Mozilla/5.0 (compatible; BaicaiMusic/1.0)")
                .header("Referer", "https://music.163.com/")
                .header("Cookie", "os=pc; appver=8.10.90; osver=Microsoft-Windows-10-Professional-build-19045-64bit; channel=netease; __remember_me=true")
                .GET()
                .build();
        try {
            HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("网易云歌单读取失败，状态码 " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            if (root.path("code").asInt(200) != 200) {
                throw new RuntimeException("网易云歌单读取失败");
            }
            return root;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("网易云歌单读取失败：" + e.getMessage());
        }
    }

    private MusicTrack upsertTrack(JsonNode node) {
        if (node == null || node.path("id").asText("").isBlank()) return null;
        String externalId = node.path("id").asText();
        String name = text(node, "name", "未知歌曲");
        String artist = firstNames(node.path("ar"), "artists");
        String cover = text(node.path("al"), "picUrl", text(node.path("album"), "picUrl", null));
        int durationMs = node.path("dt").asInt(node.path("duration").asInt(0));
        Integer duration = durationMs > 0 ? (int) Math.round(durationMs / 1000.0) : null;

        MusicTrack track = trackRepository
                .findByPlatformAndExternalTrackId("netease", externalId)
                .orElseGet(() -> MusicTrack.builder()
                        .platform("netease")
                        .externalTrackId(externalId)
                        .build());
        track.setTitle(limit(name, 300));
        track.setArtist(limit(artist, 300));
        track.setCover(limit(cover, 500));
        track.setDuration(duration);
        track.setExternalUrl("https://music.163.com/#/song?id=" + externalId);
        track.setStatus("ACTIVE");
        track.setOrphanedAt(null);
        track.setPurgeAfter(null);
        track.setLastSeenAt(LocalDateTime.now());
        return trackRepository.save(track);
    }

    private String normalizePlaylistId(String raw) {
        if (raw == null || raw.isBlank()) throw new RuntimeException("缺少公开歌单 ID");
        String value = raw.trim();
        if (NUMERIC_ID.matcher(value).matches()) return value;
        Matcher matcher = PLAYLIST_ID.matcher(value);
        if (matcher.find()) return matcher.group(1);
        Matcher loose = NUMERIC_ID.matcher(value);
        if (loose.find()) return loose.group();
        throw new RuntimeException("无法识别歌单 ID");
    }

    private String firstNames(JsonNode array, String fallbackKey) {
        List<String> names = new ArrayList<>();
        JsonNode source = array != null && array.isArray() ? array : array.path(fallbackKey);
        if (source.isArray()) {
            for (JsonNode item : source) {
                String name = item.path("name").asText("");
                if (!name.isBlank()) names.add(name);
            }
        }
        return names.isEmpty() ? null : String.join(" / ", names);
    }

    private String uniqueSlug(String title, String externalId) {
        String base = Normalizer.normalize(title == null ? "music" : title, Normalizer.Form.NFKD)
                .replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase(Locale.ROOT);
        if (base.isBlank()) base = "music-" + externalId;
        String slug = base;
        int suffix = 2;
        while (playlistRepository.findBySlug(slug).isPresent()) {
            slug = base + "-" + suffix++;
        }
        return limit(slug, 150);
    }

    private String text(JsonNode node, String field, String fallback) {
        if (node == null || node.isMissingNode() || node.isNull()) return fallback;
        String value = node.path(field).asText("");
        return value.isBlank() ? fallback : value;
    }

    private String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String limit(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }

    private String displayName(User user) {
        if (user == null) return null;
        return user.getNickname() == null || user.getNickname().isBlank()
                ? user.getUsername() : user.getNickname();
    }
}
