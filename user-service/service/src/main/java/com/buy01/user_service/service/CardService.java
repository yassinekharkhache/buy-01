package com.buy01.user_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.buy01.user_service.model.ShoppringCart;
import com.buy01.user_service.repository.CartRepository;

import lombok.AllArgsConstructor;

@Service 
@AllArgsConstructor
public class CardService {
    @Autowired
    private final CartRepository cartRepository;

    public ShoppringCart getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId);
    }

    public void addProductToCart(String userId, String productId) {
        ShoppringCart cart = cartRepository.findByUserId(userId);
        if (cart == null) {
            cart = new ShoppringCart();
            cart.setUserId(userId);
            cart.setProductIds(new String[] { productId });
        } else {
            String[] productIds = cart.getProductIds();
            String[] newProductIds = new String[productIds.length + 1];
            System.arraycopy(productIds, 0, newProductIds, 0, productIds.length);
            newProductIds[productIds.length] = productId;
            cart.setProductIds(newProductIds);
        }
        cartRepository.save(cart);
    }

    public void deleteProductFromCart(String userId, String productId) {
        ShoppringCart cart = cartRepository.findByUserId(userId);
        if (cart != null) {
            String[] productIds = cart.getProductIds();
            String[] newProductIds = new String[productIds.length - 1];
            int index = 0;
            for (String id : productIds) {
                if (!id.equals(productId)) {
                    newProductIds[index++] = id;
                }
            }
            cart.setProductIds(newProductIds);
            cartRepository.save(cart);
        }
    }
}