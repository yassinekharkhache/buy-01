package com.buy01.media_service.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final Path path;

    public WebConfig() {
        Path current = Paths.get(".").toAbsolutePath().normalize();

        current = current.getParent();

        this.path = current.resolve("media");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations(path.resolve("profile").toUri().toString());

        registry.addResourceHandler("/product/**")
                .addResourceLocations(path.resolve("product").toUri().toString());
    }
}