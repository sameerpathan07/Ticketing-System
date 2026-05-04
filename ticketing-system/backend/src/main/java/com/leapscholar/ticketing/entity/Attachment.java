package com.leapscholar.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * File attached to a ticket. Files are stored on disk under app.upload.dir
 * and metadata is stored here. {@code storedFilename} is a UUID-prefixed name
 * to avoid collisions and prevent path traversal.
 */
@Entity
@Table(name = "attachments", indexes = {
        @Index(name = "idx_attachments_ticket", columnList = "ticket_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    /** Original name shown to the user. */
    @Column(nullable = false, length = 255)
    private String originalFilename;

    /** Disk filename (UUID-prefixed). Never displayed externally. */
    @Column(nullable = false, length = 255)
    private String storedFilename;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt;

    @PrePersist
    void onCreate() {
        this.uploadedAt = Instant.now();
    }
}
