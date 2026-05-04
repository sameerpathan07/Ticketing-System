package com.leapscholar.ticketing.controller;

import com.leapscholar.ticketing.dto.AuthDtos;
import com.leapscholar.ticketing.dto.UserDtos;
import com.leapscholar.ticketing.security.CurrentUserProvider;
import com.leapscholar.ticketing.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUserProvider currentUser;

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(
            @Valid @RequestBody AuthDtos.RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(
            @Valid @RequestBody AuthDtos.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /** Client-side logout (just drops the token). Endpoint exists for symmetry. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    /** Returns current user info — useful for client to hydrate state on refresh. */
    @GetMapping("/me")
    public ResponseEntity<UserDtos.UserResponse> me() {
        return ResponseEntity.ok(UserDtos.UserResponse.from(currentUser.get()));
    }
}
