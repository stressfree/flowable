package com.example.decisioning.service;

import com.example.decisioning.dto.ValidationError;
import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.DecisioningBundle;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class CrossReferenceValidator {

    private static final Pattern EVENT_KEY_PATTERN =
        Pattern.compile("\"key\"\\s*:\\s*\"([^\"]+)\"");

    public List<ValidationError> validate(DecisioningBundle bundle) {
        List<ValidationError> errors = new ArrayList<>();
        if (bundle == null || bundle.getFiles() == null || bundle.getFiles().isEmpty()) {
            return errors;
        }

        Set<String> allIds = new HashSet<>();
        List<ParsedFile> parsedFiles = new ArrayList<>();

        for (BundleFile file : bundle.getFiles()) {
            String fileType = determineFileType(file.getFilename());
            if (fileType == null) {
                continue;
            }
            if ("EVENT".equals(fileType)) {
                collectEventKey(file.getContent(), allIds);
                continue;
            }
            Document doc = parseDocument(file.getContent());
            if (doc == null) {
                continue;
            }
            ParsedFile parsed = new ParsedFile(file, fileType, doc);
            parsedFiles.add(parsed);
            collectIds(doc, allIds);
        }

        for (ParsedFile parsed : parsedFiles) {
            switch (parsed.fileType) {
                case "BPMN" -> errors.addAll(validateBpmnReferences(parsed, allIds));
                case "CMMN" -> errors.addAll(validateCmmnReferences(parsed, allIds));
                case "DMN" -> errors.addAll(validateDmnReferences(parsed, allIds));
                default -> { }
            }
        }
        return errors;
    }

    private List<ValidationError> validateBpmnReferences(ParsedFile parsed, Set<String> allIds) {
        List<ValidationError> errors = new ArrayList<>();
        Document doc = parsed.document;
        BundleFile file = parsed.file;

        NodeList callActivities = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/BPMN/20100524/MODEL", "callActivity");
        for (int i = 0; i < callActivities.getLength(); i++) {
            Element el = (Element) callActivities.item(i);
            String calledElement = el.getAttribute("calledElement");
            if (!calledElement.isEmpty() && !allIds.contains(calledElement)) {
                errors.add(new ValidationError(
                    file.getId(),
                    file.getFilename(),
                    "BPMN",
                    "callActivity",
                    el.getAttribute("name"),
                    el.getAttribute("id"),
                    calledElement,
                    "calledElement",
                    "Upload a BPMN file containing process id=\"" + calledElement
                        + "\", or remove this callActivity from " + file.getFilename()));
            }
        }

        NodeList businessRuleTasks = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/BPMN/20100524/MODEL", "businessRuleTask");
        for (int i = 0; i < businessRuleTasks.getLength(); i++) {
            Element el = (Element) businessRuleTasks.item(i);
            String decisionRef = el.getAttribute("decisionRef");
            if (!decisionRef.isEmpty() && !allIds.contains(decisionRef)) {
                errors.add(new ValidationError(
                    file.getId(),
                    file.getFilename(),
                    "BPMN",
                    "businessRuleTask",
                    el.getAttribute("name"),
                    el.getAttribute("id"),
                    decisionRef,
                    "decisionRef",
                    "Upload a DMN file containing decision id=\"" + decisionRef
                        + "\", or remove this businessRuleTask from " + file.getFilename()));
            }
        }

        NodeList allElements = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/BPMN/20100524/MODEL", "*");
        for (int i = 0; i < allElements.getLength(); i++) {
            Element el = (Element) allElements.item(i);
            String eventRef = el.getAttribute("eventRef");
            if (!eventRef.isEmpty() && !allIds.contains(eventRef)) {
                String tagName = el.getLocalName();
                errors.add(new ValidationError(
                    file.getId(),
                    file.getFilename(),
                    "BPMN",
                    tagName,
                    el.getAttribute("name"),
                    el.getAttribute("id"),
                    eventRef,
                    "eventRef",
                    "Upload an event definition file with key=\"" + eventRef
                        + "\", or remove this " + tagName + " from " + file.getFilename()));
            }
        }

        return errors;
    }

    private List<ValidationError> validateCmmnReferences(ParsedFile parsed, Set<String> allIds) {
        List<ValidationError> errors = new ArrayList<>();
        Document doc = parsed.document;
        BundleFile file = parsed.file;

        NodeList caseTasks = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/CMMN/20151109/MODEL", "caseTask");
        for (int i = 0; i < caseTasks.getLength(); i++) {
            Element el = (Element) caseTasks.item(i);
            String caseRef = el.getAttribute("caseRef");
            if (!caseRef.isEmpty() && !allIds.contains(caseRef)) {
                errors.add(new ValidationError(
                    file.getId(),
                    file.getFilename(),
                    "CMMN",
                    "caseTask",
                    el.getAttribute("name"),
                    el.getAttribute("id"),
                    caseRef,
                    "caseRef",
                    "Upload a CMMN file containing case id=\"" + caseRef
                        + "\", or remove this caseTask from " + file.getFilename()));
            }
        }

        NodeList processTasks = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/CMMN/20151109/MODEL", "processTask");
        for (int i = 0; i < processTasks.getLength(); i++) {
            Element el = (Element) processTasks.item(i);
            String processRef = el.getAttribute("processRef");
            if (!processRef.isEmpty() && !allIds.contains(processRef)) {
                errors.add(new ValidationError(
                    file.getId(),
                    file.getFilename(),
                    "CMMN",
                    "processTask",
                    el.getAttribute("name"),
                    el.getAttribute("id"),
                    processRef,
                    "processRef",
                    "Upload a BPMN file containing process id=\"" + processRef
                        + "\", or remove this processTask from " + file.getFilename()));
            }
        }

        NodeList decisionTasks = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/CMMN/20151109/MODEL", "decisionTask");
        for (int i = 0; i < decisionTasks.getLength(); i++) {
            Element el = (Element) decisionTasks.item(i);
            String decisionRef = el.getAttribute("decisionRef");
            if (!decisionRef.isEmpty() && !allIds.contains(decisionRef)) {
                errors.add(new ValidationError(
                    file.getId(),
                    file.getFilename(),
                    "CMMN",
                    "decisionTask",
                    el.getAttribute("name"),
                    el.getAttribute("id"),
                    decisionRef,
                    "decisionRef",
                    "Upload a DMN file containing decision id=\"" + decisionRef
                        + "\", or remove this decisionTask from " + file.getFilename()));
            }
        }

        return errors;
    }

    private List<ValidationError> validateDmnReferences(ParsedFile parsed, Set<String> allIds) {
        List<ValidationError> errors = new ArrayList<>();
        Document doc = parsed.document;
        BundleFile file = parsed.file;

        NodeList decisions = doc.getElementsByTagNameNS(
            "http://www.omg.org/spec/DMN/20151101/dmn.xsd", "decision");
        for (int i = 0; i < decisions.getLength(); i++) {
            Element el = (Element) decisions.item(i);
            NodeList informationRequirements = el.getElementsByTagNameNS(
                "http://www.omg.org/spec/DMN/20151101/dmn.xsd", "requiredDecision");
            for (int j = 0; j < informationRequirements.getLength(); j++) {
                Element reqEl = (Element) informationRequirements.item(j);
                String href = reqEl.getAttribute("href");
                String refId = href.startsWith("#") ? href.substring(1) : href;
                if (!refId.isEmpty() && !allIds.contains(refId)) {
                    errors.add(new ValidationError(
                        file.getId(),
                        file.getFilename(),
                        "DMN",
                        "decision",
                        el.getAttribute("name"),
                        el.getAttribute("id"),
                        refId,
                        "decisionRef",
                        "Add a decision with id=\"" + refId
                            + "\" to this DMN file, or remove the requiredDecision reference"));
                }
            }
        }

        return errors;
    }

    private void collectIds(Document doc, Set<String> allIds) {
        NodeList allElements = doc.getElementsByTagName("*");
        for (int i = 0; i < allElements.getLength(); i++) {
            Element el = (Element) allElements.item(i);
            String id = el.getAttribute("id");
            if (!id.isEmpty()) {
                allIds.add(id);
            }
            String key = el.getAttribute("key");
            if (!key.isEmpty()) {
                allIds.add(key);
            }
        }
    }

    private void collectEventKey(byte[] content, Set<String> allIds) {
        String json = new String(content, java.nio.charset.StandardCharsets.UTF_8);
        java.util.regex.Matcher matcher = EVENT_KEY_PATTERN.matcher(json);
        if (matcher.find()) {
            allIds.add(matcher.group(1));
        }
    }

    private String determineFileType(String filename) {
        if (filename == null) return null;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".bpmn") || lower.endsWith(".bpmn20.xml")) return "BPMN";
        if (lower.endsWith(".cmmn") || lower.endsWith(".cmmn.xml")) return "CMMN";
        if (lower.endsWith(".dmn") || lower.endsWith(".dmn.xml")) return "DMN";
        if (lower.endsWith(".event") || lower.endsWith(".json")) return "EVENT";
        return null;
    }

    private Document parseDocument(byte[] content) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.parse(new ByteArrayInputStream(content));
        } catch (Exception e) {
            return null;
        }
    }

    private record ParsedFile(BundleFile file, String fileType, Document document) {}
}
