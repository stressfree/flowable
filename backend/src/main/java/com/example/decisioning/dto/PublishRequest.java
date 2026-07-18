package com.example.decisioning.dto;

import java.time.Instant;

public record PublishRequest(
    Instant goLiveAt
) {}
