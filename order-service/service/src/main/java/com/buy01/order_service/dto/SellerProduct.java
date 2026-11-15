package com.buy01.order_service.dto;

import com.buy01.order_service.model.ProductItem;

public record SellerProduct(
        double totalPrice,
        String sellerId,
        ProductItem []productItems
) {
}