package com.leapscholar.ticketing.dto;

import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.enums.Priority;
import com.leapscholar.ticketing.enums.TicketStatus;
import jakarta.validation.constraints.*;

import java.time.Instant;

public class TicketDtos {

    public record CreateTicketRequest(
            @NotBlank @Size(min = 3, max = 200) String subject,
            @NotBlank @Size(min = 5, max = 5000) String description,
            Priority priority
    ) {}

    public record UpdateTicketRequest(
            @Size(min = 3, max = 200) String subject,
            @Size(min = 5, max = 5000) String description,
            Priority priority
    ) {}

    public record StatusUpdateRequest(@NotNull TicketStatus status) {}

    public record AssignRequest(@NotNull Long assigneeId) {}

    public record RatingRequest(
            @Min(1) @Max(5) int rating,
            @Size(max = 1000) String feedback
    ) {}

    public record TicketSummaryResponse(
            Long id,
            String subject,
            TicketStatus status,
            Priority priority,
            UserDtos.UserResponse owner,
            UserDtos.UserResponse assignee,
            Integer rating,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static TicketSummaryResponse from(Ticket t) {
            return new TicketSummaryResponse(
                    t.getId(), t.getSubject(), t.getStatus(), t.getPriority(),
                    t.getOwner() != null ? UserDtos.UserResponse.from(t.getOwner()) : null,
                    t.getAssignee() != null ? UserDtos.UserResponse.from(t.getAssignee()) : null,
                    t.getRating(), t.getCreatedAt(), t.getUpdatedAt()
            );
        }
    }

    public record TicketDetailResponse(
            Long id,
            String subject,
            String description,
            TicketStatus status,
            Priority priority,
            UserDtos.UserResponse owner,
            UserDtos.UserResponse assignee,
            Integer rating,
            String ratingFeedback,
            Instant createdAt,
            Instant updatedAt,
            Instant resolvedAt,
            Instant closedAt
    ) {
        public static TicketDetailResponse from(Ticket t) {
            return new TicketDetailResponse(
                    t.getId(), t.getSubject(), t.getDescription(),
                    t.getStatus(), t.getPriority(),
                    t.getOwner() != null ? UserDtos.UserResponse.from(t.getOwner()) : null,
                    t.getAssignee() != null ? UserDtos.UserResponse.from(t.getAssignee()) : null,
                    t.getRating(), t.getRatingFeedback(),
                    t.getCreatedAt(), t.getUpdatedAt(), t.getResolvedAt(), t.getClosedAt()
            );
        }
    }

    private TicketDtos() {}
}
