package com.leapscholar.ticketing.entity;

import com.leapscholar.ticketing.enums.Priority;
import com.leapscholar.ticketing.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Support ticket raised by a user.
 *
 * - {@code owner}    — the user who created the ticket.
 * - {@code assignee} — the support agent currently working on it (nullable).
 *
 * Comments and attachments are loaded lazily; we expose them only via dedicated
 * endpoints to keep ticket-list responses small.
 */
@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "idx_tickets_owner",    columnList = "owner_id"),
        @Index(name = "idx_tickets_assignee", columnList = "assignee_id"),
        @Index(name = "idx_tickets_status",   columnList = "status"),
        @Index(name = "idx_tickets_priority", columnList = "priority")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    /** 1-5 stars; null until the owner rates the resolution. */
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String ratingFeedback;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    private Instant resolvedAt;
    private Instant closedAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
