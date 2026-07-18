package com.example.decisioning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DecisioningApplication {
    public static void main(String[] args) {
        SpringApplication.run(DecisioningApplication.class, args);
    }
}
