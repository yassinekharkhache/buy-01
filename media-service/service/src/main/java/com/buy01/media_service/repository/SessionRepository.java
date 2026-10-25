package com.buy01.media_service.repository;

import com.buy01.media_service.model.UploadSession;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface SessionRepository extends MongoRepository<UploadSession, String> {
    // Additional query methods can be defined here if needed
}