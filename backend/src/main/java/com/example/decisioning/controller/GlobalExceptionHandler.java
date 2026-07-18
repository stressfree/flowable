package com.example.decisioning.controller;

import com.example.decisioning.exception.BundleFileNotFoundException;
import com.example.decisioning.exception.BundleLifecycleException;
import com.example.decisioning.exception.BundleParseException;
import com.example.decisioning.exception.BundleValidationException;
import com.example.decisioning.exception.CompanyNotFoundException;
import com.example.decisioning.exception.FlowableDeploymentException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(CompanyNotFoundException.class)
    public ProblemDetail handleCompanyNotFound(CompanyNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setType(URI.create(ex.getType()));
        problem.setTitle(ex.getTitle());
        problem.setProperty("companyId", ex.getCompanyId());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(BundleFileNotFoundException.class)
    public ProblemDetail handleBundleFileNotFound(BundleFileNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setType(URI.create(ex.getType()));
        problem.setTitle(ex.getTitle());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(BundleValidationException.class)
    public ProblemDetail handleBundleValidation(BundleValidationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setType(URI.create(ex.getType()));
        problem.setTitle(ex.getTitle());
        problem.setProperty("bundleId", ex.getBundleId());
        problem.setProperty("errors", ex.getErrors());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(BundleParseException.class)
    public ProblemDetail handleBundleParse(BundleParseException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setType(URI.create(ex.getType()));
        problem.setTitle(ex.getTitle());
        problem.setProperty("fileId", ex.getFileId());
        problem.setProperty("filename", ex.getFilename());
        problem.setProperty("parseError", ex.getParseError());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(BundleLifecycleException.class)
    public ProblemDetail handleBundleLifecycle(BundleLifecycleException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.CONFLICT, ex.getMessage());
        problem.setType(URI.create(ex.getType()));
        problem.setTitle(ex.getTitle());
        problem.setProperty("bundleId", ex.getBundleId());
        problem.setProperty("currentStatus", ex.getCurrentStatus());
        problem.setProperty("action", ex.getAction());
        problem.setProperty("reason", ex.getReason());
        problem.setProperty("suggestion", ex.getSuggestion());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(FlowableDeploymentException.class)
    public ProblemDetail handleFlowableDeployment(FlowableDeploymentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        problem.setType(URI.create(ex.getType()));
        problem.setTitle(ex.getTitle());
        problem.setProperty("bundleId", ex.getBundleId());
        problem.setProperty("processKey", ex.getProcessKey());
        problem.setProperty("reason", ex.getReason());
        problem.setProperty("suggestion", ex.getSuggestion());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Request validation failed");
        problem.setType(URI.create("https://flowable-v2/errors/bad-request"));
        problem.setTitle("Validation failed");
        List<Map<String, String>> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> Map.of(
                "field", fe.getField(),
                "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid"))
            .collect(Collectors.toList());
        problem.setProperty("errors", fieldErrors);
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setType(URI.create("https://flowable-v2/errors/bad-request"));
        problem.setTitle("Bad request");
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.PAYLOAD_TOO_LARGE,
            "Uploaded file exceeds the maximum allowed size of 10MB");
        problem.setType(URI.create("https://flowable-v2/errors/payload-too-large"));
        problem.setTitle("File too large");
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnhandled(Exception ex) {
        log.error("Unhandled exception", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred");
        problem.setType(URI.create("https://flowable-v2/errors/internal"));
        problem.setTitle("Internal server error");
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }
}
