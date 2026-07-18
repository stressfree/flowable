package com.example.decisioning.service;

import com.example.decisioning.dto.ParseError;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Optional;

@Service
public class XmlParseService {

    public Optional<ParseError> validateWellFormed(byte[] xmlBytes) {
        try {
            SAXParserFactory factory = SAXParserFactory.newInstance();
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setNamespaceAware(true);
            SAXParser parser = factory.newSAXParser();
            parser.parse(new ByteArrayInputStream(xmlBytes),
                new org.xml.sax.helpers.DefaultHandler());
            return Optional.empty();
        } catch (SAXParseException e) {
            return Optional.of(new ParseError(
                e.getLineNumber(),
                e.getColumnNumber(),
                e.getMessage(),
                "Check that all XML tags are properly opened and closed. "
                    + "The error occurred at line " + e.getLineNumber() + "."));
        } catch (SAXException e) {
            return Optional.of(new ParseError(
                0, 0,
                e.getMessage(),
                "The XML document is not well-formed."));
        } catch (ParserConfigurationException e) {
            return Optional.of(new ParseError(
                0, 0,
                "XML parser configuration error: " + e.getMessage(),
                "Contact administrator."));
        } catch (IOException e) {
            return Optional.of(new ParseError(
                0, 0,
                "I/O error reading XML: " + e.getMessage(),
                "Ensure the file is readable."));
        }
    }
}
