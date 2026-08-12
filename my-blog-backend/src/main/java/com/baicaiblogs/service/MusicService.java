package com.baicaiblogs.service;

import com.baicaiblogs.dto.MusicResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
public class MusicService {

    private static final String NET_EASE_DETAIL_URL = "https://music.163.com/api/song/detail/?id={id}&ids=[{id}]";
    private static final String NET_EASE_LRC_URL = "https://music.163.com/api/song/lyric?id={id}&lv=-1&kv=-1&tv=-1";
    private static final String NET_EASE_SONG_URL = "https://music.163.com/song/media/outer/url?id={id}.mp3";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final HttpHeaders headers;

    public MusicService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.headers = new HttpHeaders();
        this.headers.set(HttpHeaders.USER_AGENT,
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
        this.headers.set(HttpHeaders.REFERER, "https://music.163.com/");
        // 超时设置
        restTemplate.getInterceptors().add((request, body, execution) -> {
            try {
                request.getHeaders().addAll(headers);
                return execution.execute(request, body);
            } catch (Exception e) {
                throw e;
            }
        });
    }

    public List<MusicResponse> getSongs(List<String> ids) {
        List<MusicResponse> results = new ArrayList<>();
        for (String id : ids) {
            results.add(fetchSong(id));
        }
        return results;
    }

    private MusicResponse fetchSong(String songId) {
        try {
            // 1. 获取歌曲详情
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> detailResp = restTemplate.exchange(
                    NET_EASE_DETAIL_URL, HttpMethod.GET, entity, String.class,
                    Collections.singletonMap("id", songId));

            if (detailResp.getBody() == null) {
                return MusicResponse.builder().id(songId).error("detail_empty").build();
            }

            JsonNode detailNode = objectMapper.readTree(detailResp.getBody());
            JsonNode songNode = detailNode.path("songs").get(0);
            if (songNode == null || songNode.isNull()) {
                return MusicResponse.builder().id(songId).error("not_found").build();
            }

            String name = songNode.path("name").asText("");
            String artistName = songNode.path("artists").get(0) != null
                    ? songNode.path("artists").get(0).path("name").asText("未知歌手")
                    : "未知歌手";
            String cover = songNode.path("album").path("picUrl").asText("");

            // 2. 获取歌词（可选）
            String lrcText = "";
            try {
                ResponseEntity<String> lrcResp = restTemplate.exchange(
                        NET_EASE_LRC_URL, HttpMethod.GET, entity, String.class,
                        Collections.singletonMap("id", songId));

                if (lrcResp.getBody() != null) {
                    JsonNode lrcNode = objectMapper.readTree(lrcResp.getBody());
                    lrcText = lrcNode.path("lrc").path("lyric").asText("");
                }
            } catch (Exception e) {
                log.warn("歌词解析失败 {}: {}", songId, e.getMessage());
            }

            return MusicResponse.builder()
                    .id(songId)
                    .name(name)
                    .artist(artistName)
                    .author(artistName)
                    .cover(cover)
                    .pic(cover)
                    .url(NET_EASE_SONG_URL.replace("{id}", songId))
                    .lrc(lrcText)
                    .build();

        } catch (Exception e) {
            log.error("获取歌曲 {} 失败: {}", songId, e.getMessage());
            return MusicResponse.builder()
                    .id(songId)
                    .error(e.getMessage())
                    .build();
        }
    }
}
