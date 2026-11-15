package com.buy01.order_service.dto;

public record OrderInfo(
        SellerProduct[] sellerProducts,
        double total
) {
}