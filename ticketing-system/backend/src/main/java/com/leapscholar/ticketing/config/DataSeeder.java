package com.leapscholar.ticketing.config;

import com.leapscholar.ticketing.entity.Ticket;
import com.leapscholar.ticketing.entity.User;
import com.leapscholar.ticketing.enums.Priority;
import com.leapscholar.ticketing.enums.Role;
import com.leapscholar.ticketing.enums.TicketStatus;
import com.leapscholar.ticketing.repository.TicketRepository;
import com.leapscholar.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds three demo accounts (admin / agent / user) and a couple of sample
 * tickets on first startup so the UI has something to render. Idempotent —
 * checks for existing users before inserting.
 *
 * Default credentials (CHANGE BEFORE DEPLOYING):
 *   admin@demo.com   / Admin@123
 *   agent@demo.com   / Agent@123
 *   user@demo.com    / User@123
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("DataSeeder: users already present, skipping.");
            return;
        }

        User admin = userRepository.save(User.builder()
                .fullName("Admin User")
                .email("admin@demo.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .enabled(true)
                .build());

        User agent = userRepository.save(User.builder()
                .fullName("Sam Support")
                .email("agent@demo.com")
                .passwordHash(passwordEncoder.encode("Agent@123"))
                .role(Role.SUPPORT_AGENT)
                .enabled(true)
                .build());

        User user = userRepository.save(User.builder()
                .fullName("Riya User")
                .email("user@demo.com")
                .passwordHash(passwordEncoder.encode("User@123"))
                .role(Role.USER)
                .enabled(true)
                .build());

        ticketRepository.save(Ticket.builder()
                .subject("Cannot login to dashboard")
                .description("I get a 401 every time I try to log into the dashboard from Chrome.")
                .status(TicketStatus.OPEN)
                .priority(Priority.HIGH)
                .owner(user)
                .build());

        ticketRepository.save(Ticket.builder()
                .subject("Request: dark mode")
                .description("Would love a dark theme for the user portal.")
                .status(TicketStatus.IN_PROGRESS)
                .priority(Priority.LOW)
                .owner(user)
                .assignee(agent)
                .build());

        log.info("DataSeeder: created admin/agent/user demo accounts and 2 sample tickets.");
        log.info("Logins -> admin@demo.com / Admin@123 | agent@demo.com / Agent@123 | user@demo.com / User@123");
    }
}
