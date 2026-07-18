package com.example.decisioning.dto;

public record SpawnVariable(
    String name,
    String type,
    boolean required,
    String label
) {}
