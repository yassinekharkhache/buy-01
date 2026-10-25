package com.buy01.media_service.service;

import com.buy01.media_service.dto.MainImageResponse;
import com.buy01.media_service.dto.MediaUploadResponse;
import com.buy01.media_service.dto.ProductImageResponse;
import com.buy01.media_service.model.Media;
import com.buy01.media_service.model.SessionStatus;
import com.buy01.media_service.model.UploadSession;
import com.buy01.media_service.repository.MediaRepository;
import com.buy01.media_service.repository.SessionRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DuplicateKeyException;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final SessionRepository sessionRepository;
    private final Path tmp;
    private final Path productMedia;

    public MediaService(
            MediaRepository mediaRepository,
            SessionRepository sessionRepository
        ) {
        this.mediaRepository = mediaRepository;
        this.sessionRepository = sessionRepository;
        Path current = Paths.get(".").toAbsolutePath().normalize();

        current = current.getParent();

        this.tmp = current.resolve("media/product/tmp");
        this.productMedia = current.resolve("media/product");
    }

    private static final int MAX_IMAGES_PER_SESSION = 7;
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB


    public MediaUploadResponse uploadImage(String sessionId, MultipartFile file, String ownerId, int position) {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "An image file is required");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.CONTENT_TOO_LARGE,
                    "Image size must not exceed 5 MB"
            );
        }

        UploadSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Upload session not found"));

        if (!ownerId.equals(session.getOwnerId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not own this upload session");
        }

        if (position < 0 || position >= MAX_IMAGES_PER_SESSION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Position must be between 0 and 6");
        }

        if (session.getExpiresAt() == null
                || session.getExpiresAt() < System.currentTimeMillis()) {

            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Upload session has expired");
        }

        byte[] bytes;

        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Could not read the uploaded file");
        }

        String contentType = detectImageType(bytes);

        if (contentType == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Only JPEG, PNG and WebP images are supported");
        }

        String extension = switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported image type");
        };

        String iamge_name = UUID.randomUUID().toString() + "." + extension;

        long createdAt = System.currentTimeMillis();

        Media media = Media.builder()
                .id(iamge_name)
                .ownerId(ownerId)
                .sessionId(sessionId)
                .position((int) position)
                .createdAt(createdAt)
                .status(SessionStatus.PENDING)
                .build();

        try {
            media = mediaRepository.insert(media);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Position " + position + " is already filled");
        }

        try {
            Files.createDirectories(tmp);
            file.transferTo(tmp.resolve(iamge_name));
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to save image",
                    e);
        }

        media.setStatus(SessionStatus.COMPLETED);
        mediaRepository.save(media);

        return MediaUploadResponse.builder()
                .id(iamge_name)
                .sessionId(sessionId)
                .position(position)
                .expiresAt(session.getExpiresAt())
                .build();
    }

    private String detectImageType(byte[] bytes) {

        // JPEG signature: FF D8 FF
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        // PNG signature
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {
            return "image/png";
        }

        // WebP: RIFF....WEBP
        if (bytes.length >= 12
                && bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P') {
            return "image/webp";
        }

        return null;
    }

    // commitUploadSession
    public void commitUploadSession(String sessionId, String ownerId,String productId) {
        UploadSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Upload session not found"));

        if (!ownerId.equals(session.getOwnerId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You do not own this upload session");
        }

        if (session.getExpiresAt() == null || session.getExpiresAt() < System.currentTimeMillis()) {
            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Upload session has expired");
        }

        List<Media> mediaItems = mediaRepository.findBySessionId(sessionId);


        // Move images from tmp to productMedia/{productId}/
        mediaItems.forEach(media -> {
            if (media.getStatus() == SessionStatus.COMPLETED) {
                Path source = tmp.resolve(media.getId());
                Path destinationDir = productMedia.resolve(productId);
                Path destination = destinationDir.resolve(media.getId());

                try {
                    Files.createDirectories(destinationDir);
                    Files.move(source, destination);
                } catch (IOException e) {
                    throw new RuntimeException(
                            "Failed to finalize image: " + media.getId(), e);
                }
            }
            media.setObjectKey(productId + "/" + media.getId());
            media.setProductId(productId);
            mediaRepository.save(media);
        });
        // boolean allCompleted = mediaItems.stream().allMatch(media -> SessionStatus.COMPLETED.equals(media.getStatus()));
        
        sessionRepository.deleteById(sessionId);
    }

    public boolean imageExists(String name) {
        return Files.isRegularFile(tmp.resolve(name));
    }

    public void deleteImageFromProduct(String imageId, String productId,String ownerId) {

        // 1. Find the image metadata
        Media media = mediaRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Image not found"));

        // 2. Verify ownership
        if (!media.getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You do not own this image");
        }

        // i don't know why to add it
        if (!productId.equals(media.getProductId())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Image not found for this product");
        }

        Path imagePath = productMedia.resolve(productId).resolve(imageId);

        try {
            Files.deleteIfExists(imagePath);
            mediaRepository.deleteById(imageId);

            // Remove the product directory if it is now empty.
            Path productDirectory = productMedia.resolve(productId);
            if (Files.isDirectory(productDirectory)) {
                try (var files = Files.list(productDirectory)) {
                    if (files.findAny().isEmpty()) {
                        Files.deleteIfExists(productDirectory);
                    }
                }
            }
        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to delete image " + imageId
                            + " from product " + productId, e);
        }
    }

    public void deleteImagesOfProduct(String productId) {
        Path productDirectory = productMedia.resolve(productId);

        try {
            if (Files.exists(productDirectory)) {
                try (var paths = Files.walk(productDirectory)) {
                    paths.sorted((a, b) -> b.compareTo(a))
                            .forEach(path -> {
                                try {
                                    Files.deleteIfExists(path);
                                } catch (IOException e) {
                                    throw new RuntimeException(
                                            "Failed to delete: " + path, e);
                                }
                            });
                }
            }

            // Remove the corresponding MongoDB metadata.
            mediaRepository.deleteByProductId(productId);

        } catch (IOException e) {
            throw new RuntimeException(
                    "Failed to delete images for product: " + productId, e);
        }
    }

    // getImagesOfProduct
    public List<ProductImageResponse> getImagesOfProduct(String productId){
        return mediaRepository.findByProductIdOrderByPositionAsc(productId)
            .stream()
            .map(media -> new ProductImageResponse(
                    media.getId(),
                    media.getPosition(),
                    media.getObjectKey()
            ))
            .toList();
    }

    public MainImageResponse getMainPic(String productId){
        Media media = mediaRepository
                .findByProductIdAndPosition(productId, 1)
                .orElseThrow(() -> new RuntimeException("Main image not found"));

        return new MainImageResponse(media.getId(), media.getObjectKey());
    }
}
