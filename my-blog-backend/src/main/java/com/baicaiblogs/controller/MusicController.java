package com.baicaiblogs.controller;

import com.baicaiblogs.dto.MusicResponse;
import com.baicaiblogs.service.MusicService;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/music")
@CrossOrigin(origins = "*")
public class MusicController {

    private final MusicService musicService;

    public MusicController(MusicService musicService) {
        this.musicService = musicService;
    }

    @GetMapping
    public List<MusicResponse> getSongs(@RequestParam String ids) {
        List<String> idList = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        return musicService.getSongs(idList);
    }
}
