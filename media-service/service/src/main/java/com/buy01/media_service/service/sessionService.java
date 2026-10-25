package com.buy01.media_service.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.buy01.media_service.model.Media;
import com.buy01.media_service.model.UploadSession;
import com.buy01.media_service.repository.MediaRepository;
import com.buy01.media_service.repository.SessionRepository;

@Service 
public class sessionService {

    private final SessionRepository sessionRepository;
    private final MediaRepository mediaRepository;
    private final Path tmp;

    public sessionService(SessionRepository sessionRepository,MediaRepository mediaRepository){
        this.sessionRepository = sessionRepository;
        this.mediaRepository = mediaRepository;
        Path current = Paths.get(".").toAbsolutePath().normalize();
        current = current.getParent();

        this.tmp = current.resolve("media/product/tmp");
    }

    public UploadSession createUploadSession(String ownerId) {
        var uploadSession = UploadSession.builder()
                .ownerId(ownerId)
                .expiresAt(System.currentTimeMillis() + (12 * 60 * 60 * 1000)) // Set expiration time to 12 hours
                .build();
        sessionRepository.save(uploadSession);
        return uploadSession;
    }
    

    public void deleteSessionImage(String imageId,String ownerId) {
        Media media = mediaRepository.findById(imageId)
        .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Image not found"));

        if (!media.getOwnerId().equals(ownerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You do not own this image");
        }

        Path imagePath = tmp.resolve(imageId).normalize();

        if (!imagePath.startsWith(tmp.normalize())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid image ID");
        }

        try {
            Files.deleteIfExists(tmp.resolve(imageId));
            mediaRepository.deleteById(imageId);
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Failed to delete temporary image: " + imageId, e);
        }
    }
}
