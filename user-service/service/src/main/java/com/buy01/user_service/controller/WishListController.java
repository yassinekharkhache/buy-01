package com.buy01.user_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.buy01.user_service.dto.WishListDto;
import com.buy01.user_service.model.User;
import com.buy01.user_service.model.WishList;
import com.buy01.user_service.service.WishListService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@RestController 
@RequestMapping("/api/wishlist")
@AllArgsConstructor 
public class WishListController {

    private final WishListService wishListService;

    // add with list
    @PostMapping 
    public ResponseEntity<Map<String, String>> AddWishList(@Valid @RequestBody WishListDto data){
        wishListService.addProductToWishList(data);
        return ResponseEntity.ok(Map.of("message", "Product added to wishlist"));
    }

    @DeleteMapping
    public ResponseEntity<Void> DeleteWishList(@Valid @RequestBody WishListDto data){
        wishListService.deleteProductFromWithList(data);
        return ResponseEntity.noContent().build();
    }

    // get my wish list
    @GetMapping 
    public ResponseEntity<List<WishList>> GetMyWishList(@AuthenticationPrincipal User user){
        String userId = user.getId();
        List<WishList> wishList = wishListService.getMyWishList(userId);
        return ResponseEntity.ok(wishList);
    }
}
