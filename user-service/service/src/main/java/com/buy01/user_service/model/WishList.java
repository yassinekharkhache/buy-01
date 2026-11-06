package com.buy01.user_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document (collection = "WishList")
@Data 
@Builder
@AllArgsConstructor 
@NoArgsConstructor 
@CompoundIndex(
    name = "user_product_unique",
    def = "{'userId': 1, 'productId': 1}",
    unique = true
)
public class WishList {
    
    
    @Id
    private String id;

    @Field ("userId")
    private String userId;

    @Field ("productId")
    private String productId;

}
