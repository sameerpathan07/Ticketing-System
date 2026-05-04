package com.leapscholar.ticketing.dto;

import com.leapscholar.ticketing.entity.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class CommentDtos {

    public record CreateCommentRequest(
            @NotBlank @Size(min = 1, max = 5000) String content
    ) {}

    public record CommentResponse(
            Long id,
            String content,
            UserDtos.UserResponse author,
            Instant createdAt
    ) {
        public static CommentResponse from(Comment c) {
            return new CommentResponse(
                    c.getId(),
                    c.getContent(),
                    c.getAuthor() != null ? UserDtos.UserResponse.from(c.getAuthor()) : null,
                    c.getCreatedAt()
            );
        }
    }

    private CommentDtos() {}
}
