package com.buy01.media_service.config;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration 
public class JwtDecode {
    @Value("${jwt.public-key-path}")
    private Resource publicKeyResource;

    @Bean
    public JwtDecoder jwtDecoder() throws Exception {

        // Read the PEM-encoded RSA public key.
        String pem;

        try (InputStream input = publicKeyResource.getInputStream()) {
            pem = new String(input.readAllBytes());
        } catch (Exception e) {
            throw new RuntimeException("Failed to read public key from resource", e);
        }

        // Remove PEM headers and whitespace to get the Base64-encoded key.
        String base64Key = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(base64Key);

        // Convert the encoded bytes into a Java RSA public key.
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);

        RSAPublicKey publicKey = (RSAPublicKey) KeyFactory.getInstance("RSA")
                                                          .generatePublic(keySpec);

        // Configure JWT signature verification using RS256-compatible RSA key.
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(publicKey).build();

        // Validate expiration, not-before time, and the expected issuer.
        decoder.setJwtValidator(
                JwtValidators.createDefaultWithIssuer("buy01-user-service")
        );

        return decoder;
    }
}