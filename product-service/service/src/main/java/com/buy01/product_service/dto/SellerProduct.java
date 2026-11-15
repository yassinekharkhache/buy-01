package com.buy01.product_service.dto;

public record SellerProduct(
        double totalPrice,
        String sellerId,
        ProductItem []productItems
) {
}
