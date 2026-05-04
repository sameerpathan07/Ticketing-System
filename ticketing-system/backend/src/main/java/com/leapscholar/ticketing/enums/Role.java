package com.leapscholar.ticketing.enums;

/**
 * Roles for role-based access control.
 *
 * USER          - Regular end user; can raise & manage own tickets.
 * SUPPORT_AGENT - Can be assigned tickets, comment, change status.
 * ADMIN         - Full control: user management + ticket overrides.
 */
public enum Role {
    USER,
    SUPPORT_AGENT,
    ADMIN
}
