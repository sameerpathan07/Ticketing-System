package com.leapscholar.ticketing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Ticketing System – main entry point.
 *
 * Run locally:
 *   mvn spring-boot:run
 *
 * Run with Postgres:
 *   mvn spring-boot:run -Dspring-boot.run.profiles=postgres
 */
@SpringBootApplication
@EnableAsync
public class TicketingApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketingApplication.class, args);
    }
}
