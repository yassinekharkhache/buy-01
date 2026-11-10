package com.buy01.user_service.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// import com.buy01.user_service.dto.;
import com.buy01.user_service.model.User;
import com.buy01.user_service.model.ShoppringCart;
import com.buy01.user_service.service.CardService;

import lombok.AllArgsConstructor;

@RestController 
@RequestMapping ("/api/card")
@AllArgsConstructor 
public class CardController {

    private final CardService cardService;

    @PostMapping("/{productId}")
    public void addProductToCart(@PathVariable String productId, @AuthenticationPrincipal User user) {
        cardService.addProductToCart(user.getId(), productId);
    }

    @GetMapping
    public ShoppringCart getCartByUserId(@AuthenticationPrincipal User user) {
        return cardService.getCartByUserId(user.getId());
    }

    @DeleteMapping("/{productId}")
    public void deleteProductFromCart(@PathVariable String productId, @AuthenticationPrincipal User user) {
        cardService.deleteProductFromCart(user.getId(), productId);
    }
}
