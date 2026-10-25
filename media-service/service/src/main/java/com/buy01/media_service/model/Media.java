package com.buy01.media_service.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Document (collection = "media")
@CompoundIndex(name = "product_position_idx", def = "{'productId': 1, 'position': 1}")
@CompoundIndex(name = "session_position_uq",def = "{'sessionId': 1, 'position': 1}", unique = true)
@Data 
@Builder 
@NoArgsConstructor 
@AllArgsConstructor 
public class Media {

    @Id
    private String id;

    @Indexed
    @Field ("productId")
    private String productId;
    
    @Field ("ownerId")
    private String ownerId;

    @Field ("position")
    private int position;

    @Field ("objectKey")
    private String objectKey;

    @Field ("createdAt")
    private long createdAt;

    @Field ("sessionId")
    private String sessionId;

    private SessionStatus status;
}