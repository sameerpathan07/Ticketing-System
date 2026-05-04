package com.leapscholar.ticketing.service;

import com.leapscholar.ticketing.dto.AuthDtos;
import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.enums.Role;
import com.leapscholar.ticketing.exception.BadRequestException;
import com.leapscholar.ticketing.repository.UserRepository;
import com.leapscholar.ticketing.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authManager;
    private final JwtService jwtService;

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered");
        }
        // Self-registration is always Role.USER. Admins create staff accounts
        // through the user-management endpoint.
        User user = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.USER)
                .enabled(true)
                .build();
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        // AuthenticationManager throws BadCredentialsException -> 401 via handler
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BadRequestException("User not found"));
        return buildAuthResponse(user);
    }

    private AuthDtos.AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthDtos.AuthResponse(
                token, user.getId(), user.getEmail(),
                user.getFullName(), user.getRole());
    }
}
