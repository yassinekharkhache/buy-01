package com.buy01.product_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Document (collection = "products")
@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
public class Product {

    @Id
    private String id;

    @Field("name")
    private String name;

    @Field("description")
    private String description;

    @Indexed(unique = true)
    @Field ("userId")
    private String userId;

    @Field ("category")
    private ProductCategory category;

    @Field ("price")
    private double price;
    
    
    @Field ("quantity")
    private int quantity;

    @Field ("mainPicPosition")
    private int mainPicPosition;

    // createdAt
    @Field ("createdAt")
    private long createdAt;
}