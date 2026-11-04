package com.buy01.media_service.repository;

import com.buy01.media_service.model.Media;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRepository extends MongoRepository<Media, String> {
    int countBySessionId(String sessionId);
    List<Media> findBySessionId(String sessionId);
    void deleteByProductId(String productId);
    List<Media> findByProductIdOrderByPositionAsc(String productId);
    // findByProductIdAndPosition
    Optional<Media> findByProductIdAndPosition(String productId,int position);
}