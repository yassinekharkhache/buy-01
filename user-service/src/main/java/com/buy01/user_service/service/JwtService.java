package com.buy01.user_service.service;

import com.buy01.user_service.model.User;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    @Value("${jwt.private-key-path}")
    private String privateKeyPath;

    @Value("${jwt.public-key-path}")
    private String publicKeyPath;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void init() throws Exception {
        KeyFactory factory = KeyFactory.getInstance("RSA");

        // Load the private key used to sign JWTs.
        String privatePem = Files.readString(Path.of(privateKeyPath));
        privatePem = privatePem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        privateKey = factory.generatePrivate(
                new PKCS8EncodedKeySpec(
                        Base64.getDecoder().decode(privatePem)));

        // Load the public key used to verify JWTs.
        String publicPem = Files.readString(Path.of(publicKeyPath));
        publicPem = publicPem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        publicKey = factory.generatePublic(
                new X509EncodedKeySpec(
                        Base64.getDecoder().decode(publicPem)));
    }


    public String generateToken(User user) {
        Date now = new Date();
        return Jwts.builder()
                .claim("userID", user.getId())
                .claim("role", user.getRole())
                .subject(user.getUsername())
                .issuer("buy01-user-service")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 1000L * 60 * 60 * 24 * 7))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .requireIssuer("buy01-user-service")
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    public boolean isTokenValid(String token, User user) {
        return extractUsername(token).equals(user.getUsername());
    }
}