package com.buy01.media_service.controller;

import com.buy01.media_service.dto.MainImageResponse;
import com.buy01.media_service.dto.ProductImageResponse;
import com.buy01.media_service.model.UploadSession;
import lombok.AllArgsConstructor;

import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.buy01.media_service.service.MediaService;
import com.buy01.media_service.service.sessionService;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@AllArgsConstructor
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;
    private final sessionService SessionService;

    @PostMapping("/upload-sessions")
    public ResponseEntity<Map<String, Object>> createUploadSession(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("userID");
        UploadSession session = SessionService.createUploadSession(userId);
        return ResponseEntity.created(URI.create("/api/media/upload-sessions/" + session.getId())).body(Map.of("id", session.getId(), "expiresAt", session.getExpiresAt().toString()));
    }
    
    @PostMapping("/upload-sessions/{sessionId}/images")
    public ResponseEntity<String> uploadImage(@PathVariable String sessionId,
            @RequestParam MultipartFile file,
            @RequestParam("position") int position,
            @AuthenticationPrincipal Jwt jwt) {
        mediaService.uploadImage(sessionId, file, jwt.getClaimAsString("userID"), position);
        return ResponseEntity.status(201).body("Image uploaded successfully");
    }

    // @PostMapping ("/upload-sessions/{sessionId}/commit")// <<< this will not be end point any more i will be kafka envet
    // public ResponseEntity<String> commitUploadSession(@PathVariable String sessionId,
    //         @AuthenticationPrincipal Jwt jwt) {
    //     // mediaService.commitUploadSession(sessionId, jwt.getClaimAsString("userID"));
    //     return ResponseEntity.ok("Upload session committed successfully");
    // }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteSessionImage(
        @PathVariable String imageId,
        @AuthenticationPrincipal Jwt jwt) {
            String userId = jwt.getClaimAsString("userID");

            SessionService.deleteSessionImage(imageId, userId);

            return ResponseEntity.noContent().build();
    }


    @GetMapping("/products/{productId}/images")
    public ResponseEntity<List<ProductImageResponse>> getImagesOfProduct(@PathVariable String productId) {
        List<ProductImageResponse> images = mediaService.getImagesOfProduct(productId);
        return ResponseEntity.ok(images);
    }

    @GetMapping("/products/{productId}/images/main")
    public ResponseEntity<?> productMainImage(@PathVariable String productId){
        MainImageResponse image = mediaService.getMainPic(productId);
        return ResponseEntity.ok(image);
    }
}