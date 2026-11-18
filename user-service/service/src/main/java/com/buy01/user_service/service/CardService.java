package com.buy01.user_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.buy01.user_service.model.ShoppringCart;
import com.buy01.user_service.repository.CartRepository;

import lombok.AllArgsConstructor;

@Service 
@AllArgsConstructor
public class CardService {

    private final CartRepository cartRepository;

    public ShoppringCart getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId);
    }

    public void addProductToCart(String userId, String productId) {

        ShoppringCart cart = cartRepository.findByUserId(userId);

        if (cart == null) {
            cart = new ShoppringCart();
            cart.setUserId(userId);
            cart.setProductIds(new String[]{productId});
        } else {
            List<String> productIds = new ArrayList<>(
                cart.getProductIds() == null
                    ? List.of()
                    : List.of(cart.getProductIds())
            );

            if (!productIds.contains(productId)) {
                productIds.add(productId);
            }

            cart.setProductIds(productIds.toArray(new String[0]));
        }

        cartRepository.save(cart);
    }

    public void deleteProductFromCart(String userId, String productId) {
        ShoppringCart cart = cartRepository.findByUserId(userId);

        if (cart == null || cart.getProductIds() == null) {
            return;
        }

        List<String> productIds = new ArrayList<>(
            List.of(cart.getProductIds())
        );

        productIds.removeIf(id -> Objects.equals(id, productId));

        cart.setProductIds(productIds.toArray(new String[0]));

        cartRepository.save(cart);
    }
}