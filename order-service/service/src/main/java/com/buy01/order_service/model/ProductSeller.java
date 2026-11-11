package com.buy01.order_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document (collection = "product_sellers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSeller {
    @Id 
    private String id;

    private String productId;

    private String sellerId;
}
