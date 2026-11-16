package com.buy01.order_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
@Configuration 
public class RestClientConfig {

	
    @Value("${gateway.url}")
    private String gatewayUrl;

    @Bean 
    public RestClient productRestClient() {
        return RestClient.builder()
                .baseUrl(gatewayUrl)
                .build();
    }
}
