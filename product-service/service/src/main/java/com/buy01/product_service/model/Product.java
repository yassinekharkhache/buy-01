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

    @Field ("price")
    private double price;

    @Field ("quantity")
    private int quantity;

    @Indexed(unique = true)
    @Field ("userId")
    private String userId;

    // createdAt
    @Field ("createdAt")
    private long createdAt;
}
