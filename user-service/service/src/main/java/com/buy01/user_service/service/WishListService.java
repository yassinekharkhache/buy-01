package com.buy01.user_service.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.buy01.user_service.repository.WishListRepository;
import com.buy01.user_service.dto.WishListDto;
import com.buy01.user_service.model.WishList;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor 
public class WishListService {

    private final WishListRepository wishListRepository;

    public void addProductToWishList(WishListDto data){
        WishList wishList = new WishList();
        wishList.setUserId(data.UserId());
        wishList.setProductId(data.ProductId());
        wishListRepository.save(wishList);
    }

    public void deleteProductFromWithList(WishListDto data){
        wishListRepository.deleteByUserIdAndProductId(data.UserId(), data.ProductId());
    }

    // get My Wish List
    public List<WishList> getMyWishList(String userId){
        return wishListRepository.findByUserId(userId);
    }

}
