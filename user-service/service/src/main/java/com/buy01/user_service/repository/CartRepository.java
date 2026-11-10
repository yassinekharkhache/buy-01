package com.buy01.user_service.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.buy01.user_service.model.ShoppringCart;

public interface CartRepository extends MongoRepository<ShoppringCart, String> {
    ShoppringCart findByUserId(String userId);
    void deleteByUserId(String userId);
}
