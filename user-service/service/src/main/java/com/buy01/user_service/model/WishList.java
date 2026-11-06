package com.buy01.user_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Document (collection = "wishlists")
@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor
public class WishList {

    @Id
    private String id;

    private String userId;

    private String productId;
}