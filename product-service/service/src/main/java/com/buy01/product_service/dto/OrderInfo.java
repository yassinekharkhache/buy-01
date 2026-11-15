package com.buy01.product_service.dto;

public record OrderInfo(
        SellerProduct[] sellerProducts,
        double total
) {
}