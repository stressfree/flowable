package com.example.decisioning.exception;

import com.example.decisioning.dto.ParseError;

public class BundleParseException extends DecisioningException {

    private final Long fileId;
    private final String filename;
    private final ParseError parseError;

    public BundleParseException(Long fileId, String filename, ParseError parseError) {
        super(
            "https://flowable-v2/errors/parse-failed",
            "XML parse error",
            "The file " + filename + " contains malformed XML");
        this.fileId = fileId;
        this.filename = filename;
        this.parseError = parseError;
    }

    public Long getFileId() {
        return fileId;
    }

    public String getFilename() {
        return filename;
    }

    public ParseError getParseError() {
        return parseError;
    }

    @Override
    public int getHttpStatus() {
        return 422;
    }
}
