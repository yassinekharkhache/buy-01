package com.buy01.user_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.buy01.user_service.model.WishList;

public interface WishListRepository extends MongoRepository<WishList, String> {
    Optional<WishList> findByUserIdAndProductId(String userId, String productId);
    // delete a wishlist by userId and productId
    void deleteByUserIdAndProductId(String userId, String productId);
    // find all wishlists by userId
    List<WishList> findAllByUserId(String userId);
    int countByUserId(String userId);
}
