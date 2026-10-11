package com.buy01.user_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.buy01.user_service.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    // findByName
    Optional<User> findByName(String userName);
    
}
