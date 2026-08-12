package com.baicaiblogs.service;

import com.baicaiblogs.dto.*;
import com.baicaiblogs.entity.Album;
import com.baicaiblogs.entity.Photo;
import com.baicaiblogs.repository.AlbumRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<AlbumResponse> getAllAlbums() {
        return albumRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlbumResponse createAlbum(AlbumRequest request) {
        if (albumRepository.existsByAlbumId(request.getAlbumId())) {
            throw new RuntimeException("Album ID 已存在: " + request.getAlbumId());
        }

        Album album = Album.builder()
                .albumId(request.getAlbumId())
                .title(request.getTitle())
                .description(request.getDescription())
                .cover(request.getCover())
                .date(request.getDate())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        if (request.getPhotos() != null) {
            album.setPhotos(request.getPhotos().stream()
                    .map(photoRequest -> Photo.builder()
                            .url(photoRequest.getUrl())
                            .caption(photoRequest.getCaption())
                            .sortOrder(photoRequest.getSortOrder() != null ? photoRequest.getSortOrder() : 0)
                            .album(album)
                            .build())
                    .collect(Collectors.toList()));
        }

        return toResponse(albumRepository.save(album));
    }

    @Transactional
    public AlbumResponse updateAlbum(String albumId, AlbumRequest request) {
        Album album = albumRepository.findByAlbumId(albumId)
                .orElseThrow(() -> new RuntimeException("相册不存在: " + albumId));

        album.setTitle(request.getTitle());
        album.setDescription(request.getDescription());
        album.setCover(request.getCover());
        album.setDate(request.getDate());
        if (request.getSortOrder() != null) {
            album.setSortOrder(request.getSortOrder());
        }

        if (request.getPhotos() != null) {
            album.getPhotos().clear();
            album.getPhotos().addAll(request.getPhotos().stream()
                    .map(photoRequest -> Photo.builder()
                            .url(photoRequest.getUrl())
                            .caption(photoRequest.getCaption())
                            .sortOrder(photoRequest.getSortOrder() != null ? photoRequest.getSortOrder() : 0)
                            .album(album)
                            .build())
                    .collect(Collectors.toList()));
        }

        return toResponse(albumRepository.save(album));
    }

    @Transactional
    public void deleteAlbum(String albumId) {
        if (!albumRepository.existsByAlbumId(albumId)) {
            throw new RuntimeException("相册不存在: " + albumId);
        }
        albumRepository.deleteByAlbumId(albumId);
    }

    private AlbumResponse toResponse(Album album) {
        List<PhotoResponse> photos = album.getPhotos() != null ?
                album.getPhotos().stream()
                        .map(photo -> PhotoResponse.builder()
                                .id(photo.getId())
                                .url(photo.getUrl())
                                .caption(photo.getCaption())
                                .sortOrder(photo.getSortOrder())
                                .build())
                        .collect(Collectors.toList()) : List.of();

        return AlbumResponse.builder()
                .id(album.getId())
                .albumId(album.getAlbumId())
                .title(album.getTitle())
                .description(album.getDescription())
                .cover(album.getCover())
                .date(album.getDate())
                .sortOrder(album.getSortOrder())
                .photos(photos)
                .build();
    }
}
