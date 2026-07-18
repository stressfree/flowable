package com.example.decisioning.dto;

public record ParseError(
    int line,
    int column,
    String message,
    String suggestion
) {}
