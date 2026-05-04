package com.leapscholar.ticketing.dto;

import com.leapscholar.ticketing.entity.Attachment;

import java.time.Instant;

public class AttachmentDtos {

    public record AttachmentResponse(
            Long id,
            String originalFilename,
            String contentType,
            long sizeBytes,
            UserDtos.UserResponse uploadedBy,
            Instant uploadedAt
    ) {
        public static AttachmentResponse from(Attachment a) {
            return new AttachmentResponse(
                    a.getId(),
                    a.getOriginalFilename(),
                    a.getContentType(),
                    a.getSizeBytes(),
                    a.getUploadedBy() != null ? UserDtos.UserResponse.from(a.getUploadedBy()) : null,
                    a.getUploadedAt()
            );
        }
    }

    private AttachmentDtos() {}
}
