package com.buy01.user_service.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.buy01.user_service.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByName(String name);
    boolean existsByEmail(String email);
    boolean existsByName(String UserName);
}
