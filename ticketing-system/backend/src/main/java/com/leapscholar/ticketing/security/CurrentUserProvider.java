package com.leapscholar.ticketing.security;

import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.exception.ForbiddenException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Convenience helper for fetching the currently authenticated User from
 * Spring Security's context. Throws ForbiddenException if no user is bound,
 * which the global handler maps to 403.
 */
@Component
public class CurrentUserProvider {

    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User user)) {
            throw new ForbiddenException("Not authenticated");
        }
        return user;
    }
}
