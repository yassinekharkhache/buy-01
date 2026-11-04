package com.buy01.media_service.kafka.consumer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.buy01.media_service.kafka.dto.ProductCreatedEvent;
import com.buy01.media_service.model.SessionStatus;
import com.buy01.media_service.model.UploadSession;
import com.buy01.media_service.repository.MediaRepository;
import com.buy01.media_service.repository.SessionRepository;

@Service 
public class ProductEventConsumer {

    private final MediaRepository mediaRepository;
    private final SessionRepository sessionRepository;
    private final Path tmp;
    private final Path productMedia;

    public ProductEventConsumer(MediaRepository mediaRepository, SessionRepository sessionRepository) {
        this.mediaRepository = mediaRepository;
        this.sessionRepository = sessionRepository;
        Path current = Paths.get(".").toAbsolutePath().normalize();

        current = current.getParent();

        this.tmp = current.resolve("media/product/tmp");
        this.productMedia = current.resolve("media/product");
    }


@KafkaListener(
    topics = "product-created",
    groupId = "product-group"
)
public void consume(ProductCreatedEvent event) {
        

        UploadSession session = sessionRepository
                .findById(event.uploadSessionId())
                .orElseThrow(() -> new IllegalStateException(
                    "Upload session not found: " + event.uploadSessionId()
                ));

        // Validate ownership
        if (!event.userId().equals(session.getOwnerId())) {
            throw new IllegalArgumentException("Session owner mismatch");
        }

        // Validate expiration
        if (session.getExpiresAt() == null ||
            session.getExpiresAt() < System.currentTimeMillis()) {
            throw new IllegalStateException("Upload session expired");
        }

        var mediaItems = mediaRepository.findBySessionId(
                event.uploadSessionId()
        );

        Path destinationDir = productMedia
                .resolve(event.productId())
                .normalize();

        if (!destinationDir.startsWith(productMedia)) {
            throw new IllegalArgumentException("Invalid product ID");
        }

        try {
            Files.createDirectories(destinationDir);

            for (var media : mediaItems) {

                if (media.getStatus() != SessionStatus.COMPLETED) {
                    throw new IllegalStateException(
                        "Media is not completed: " + media.getId()
                    );
                }

                Path source = tmp.resolve(media.getId()).normalize();

                Path destination = destinationDir
                        .resolve(media.getId())
                        .normalize();

                if (!source.startsWith(tmp) ||
                    !destination.startsWith(destinationDir)) {
                    throw new SecurityException("Invalid media filename");
                }

                // Idempotency: handle an already-moved file
                if (!Files.exists(destination)) {
                    Files.move(source, destination);
                }
                
                media.setProductId(event.productId());

                mediaRepository.save(media);
            }

            // Delete session only after successful processing
            sessionRepository.deleteById(event.uploadSessionId());

        } catch (IOException e) {
            throw new RuntimeException(
                "Failed to process product media for product: "
                    + event.productId(),
                e
            );
        }
    }


    public void moveToProduction(String name) throws IOException {

        Path source = tmp.resolve(name);
        Path destination = productMedia.resolve(name);

        Files.createDirectories(productMedia);

        Files.move(
            source,
            destination,
            StandardCopyOption.REPLACE_EXISTING
        );
    }
    
}
