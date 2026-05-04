package com.leapscholar.ticketing.enums;

/**
 * Ticket lifecycle:
 *   OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
 *
 * The validation of allowed transitions lives in TicketService.
 */
public enum TicketStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED
}
