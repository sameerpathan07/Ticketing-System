package com.leapscholar.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A comment on a ticket. Forms the conversation thread between the user and
 * the support agent. We snapshot author info on the comment row itself only
 * for created-at; everything else is fetched via the relation.
 */
@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comments_ticket", columnList = "ticket_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
