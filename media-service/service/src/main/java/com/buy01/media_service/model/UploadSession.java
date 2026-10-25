package com.buy01.media_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "upload_sessions")
@Data 
@Builder 
@NoArgsConstructor
@AllArgsConstructor
public class UploadSession {

    @Id
    private String id;

    private String ownerId;

    private Long expiresAt;
}