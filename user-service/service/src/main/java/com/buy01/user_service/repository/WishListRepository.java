package com.buy01.user_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.buy01.user_service.model.WishList;

public interface WishListRepository extends MongoRepository<WishList, String> {
    List<WishList> findByUserId(String userId);
    void deleteByUserIdAndProductId(String userId, String productId);
}
