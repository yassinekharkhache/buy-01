package com.buy01.user_service.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.buy01.user_service.dto.WishListDto;
import com.buy01.user_service.model.User;
import com.buy01.user_service.service.WishListService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/api/wishlist")
public class WishListController {

    private final WishListService wishListService;

    @PostMapping("/{productId}")
    public ResponseEntity<String> addToWishList(@PathVariable String productId, @AuthenticationPrincipal User user) {
        WishListDto data = new WishListDto(user.getId(), productId);
        wishListService.addToWishList(data);
        return ResponseEntity.ok("Product added to wishlist successfully");
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<String> deleteFromWishList(@PathVariable String productId, @AuthenticationPrincipal User user) {
        WishListDto data = new WishListDto(user.getId(), productId);
        wishListService.deleteFromWishList(data);
        return ResponseEntity.ok("Product removed from wishlist successfully");
    }

    @GetMapping
    public ResponseEntity<List<?>> getUserWishList(@AuthenticationPrincipal User user) {
        List<?> productIds = wishListService.userWishList(user.getId());
        return ResponseEntity.ok(productIds);
    }

    // is product in wishlist
    @GetMapping("/{productId}")
    public ResponseEntity<Boolean> isProductInWishList(@PathVariable String productId, @AuthenticationPrincipal User user) {
        boolean isInWishList = wishListService.isProductInWishList(user.getId(), productId);
        return ResponseEntity.ok(isInWishList);
    }
}
