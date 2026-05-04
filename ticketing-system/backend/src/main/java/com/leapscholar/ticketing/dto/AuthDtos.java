package com.leapscholar.ticketing.dto;

import com.leapscholar.ticketing.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String fullName,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, max = 100) String password
    ) {}

    public record AuthResponse(
            String token,
            Long userId,
            String email,
            String fullName,
            Role role
    ) {}

    private AuthDtos() {}
}
