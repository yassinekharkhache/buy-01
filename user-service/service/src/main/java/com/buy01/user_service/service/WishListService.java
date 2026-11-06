package com.buy01.user_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.buy01.user_service.dto.WishListDto;
import com.buy01.user_service.model.WishList;
import com.buy01.user_service.repository.WishListRepository;

import lombok.AllArgsConstructor;

@Service 
@AllArgsConstructor 
public class WishListService {

    private final WishListRepository wishListRepository;
    
    public void addToWishList(WishListDto data){
        WishList wishList = new WishList();
        wishList.setUserId(data.userId());
        wishList.setProductId(data.productId());
        wishListRepository.save(wishList);
    }

    public void deleteFromWishList(WishListDto data){
        wishListRepository.deleteByUserIdAndProductId(data.userId(),data.productId());
    }

    public List<?> userWishList(String userId){
        if (countUserWishList(userId) == 50) {
            throw new RuntimeException("User has reached the maximum number of wish list items (50).");
        }
        List<?> productIds = wishListRepository.findAllByUserId(userId);
        return productIds;
    }

    public int countUserWishList(String userId){
        return wishListRepository.countByUserId(userId);
    }

    // check if product is in wishlist
    public boolean isProductInWishList(String userId, String productId){
        return wishListRepository.findByUserIdAndProductId(userId, productId).isPresent();
    }
}
