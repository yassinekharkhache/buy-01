package com.buy01.order_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration 
public class RestClientConfig {

    @Bean 
    public RestClient productRestClient() {
        return RestClient.builder()
                .baseUrl("http://product-service")
                .build();
    }
}