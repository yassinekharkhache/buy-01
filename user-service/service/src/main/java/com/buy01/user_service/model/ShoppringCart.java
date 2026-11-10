package com.buy01.user_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document (collection = "cards")
@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
/*
    shopping card is list of products that will be ordred togather
*/
public class ShoppringCart {
    @Id 
    private String id;

    @Field("user_id")
    private String userId;

    @Field("product_ids")
    private String[] productIds;
}
