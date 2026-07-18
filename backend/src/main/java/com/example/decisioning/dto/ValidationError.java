package com.example.decisioning.dto;

public record ValidationError(
    Long fileId,
    String filename,
    String fileType,
    String elementType,
    String elementName,
    String elementId,
    String missingReference,
    String referenceAttribute,
    String suggestion
) {}
