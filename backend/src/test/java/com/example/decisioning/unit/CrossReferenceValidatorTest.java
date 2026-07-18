package com.example.decisioning.unit;

import com.example.decisioning.dto.ValidationError;
import com.example.decisioning.entity.BundleFile;
import com.example.decisioning.entity.BundleStatus;
import com.example.decisioning.entity.BundleType;
import com.example.decisioning.entity.DecisioningBundle;
import com.example.decisioning.service.CrossReferenceValidator;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CrossReferenceValidatorTest {

    private final CrossReferenceValidator validator = new CrossReferenceValidator();

    private static final String BPMN_WITH_CALL_ACTIVITY = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     targetNamespace="http://example.com">
          <process id="main-process" name="Main Process" isExecutable="true">
            <startEvent id="start"/>
            <callActivity id="callSub" name="Approve Invoice"
                          calledElement="subprocess-invoice"/>
            <endEvent id="end"/>
            <sequenceFlow id="f1" sourceRef="start" targetRef="callSub"/>
            <sequenceFlow id="f2" sourceRef="callSub" targetRef="end"/>
          </process>
        </definitions>
        """;

    private static final String BPMN_WITH_BUSINESS_RULE_TASK = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     targetNamespace="http://example.com">
          <process id="expense-process" name="Expense Process" isExecutable="true">
            <startEvent id="start"/>
            <businessRuleTask id="brt1" name="Travel Check" decisionRef="travel-check"/>
            <endEvent id="end"/>
            <sequenceFlow id="f1" sourceRef="start" targetRef="brt1"/>
            <sequenceFlow id="f2" sourceRef="brt1" targetRef="end"/>
          </process>
        </definitions>
        """;

    private static final String BPMN_WITH_EVENT_REF = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     targetNamespace="http://example.com">
          <process id="event-process" name="Event Process" isExecutable="true">
            <startEvent id="start"/>
            <intermediateCatchEvent id="catchEvent" name="Wait for Event"
                                    eventRef="expense-submitted"/>
            <endEvent id="end"/>
            <sequenceFlow id="f1" sourceRef="start" targetRef="catchEvent"/>
            <sequenceFlow id="f2" sourceRef="catchEvent" targetRef="end"/>
          </process>
        </definitions>
        """;

    private static final String BPMN_VALID = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     targetNamespace="http://example.com">
          <process id="simple-process" name="Simple Process" isExecutable="true">
            <startEvent id="start"/>
            <endEvent id="end"/>
            <sequenceFlow id="f1" sourceRef="start" targetRef="end"/>
          </process>
        </definitions>
        """;

    private static final String BPMN_SUBPROCESS = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     targetNamespace="http://example.com">
          <process id="subprocess-invoice" name="Invoice Subprocess" isExecutable="true">
            <startEvent id="subStart"/>
            <endEvent id="subEnd"/>
            <sequenceFlow id="sf1" sourceRef="subStart" targetRef="subEnd"/>
          </process>
        </definitions>
        """;

    private static final String DMN_VALID = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                     id="definitions" name="Decisions">
          <decision id="travel-check" name="Travel Check">
            <decisionTable id="dt1">
              <input id="i1"><inputExpression id="ie1" typeRef="boolean">
                <text>hasTravel</text></inputExpression></input>
              <output id="o1" typeRef="string" name="approvalPath"/>
              <rule id="r1"><inputEntry id="ie_r1"><text>true</text></inputEntry>
                <outputEntry id="oe_r1"><text>"DIRECTOR"</text></outputEntry></rule>
            </decisionTable>
          </decision>
        </definitions>
        """;

    private static final String DMN_WITH_REQUIRED_DECISION = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                     id="definitions" name="Decisions">
          <decision id="combined-decision" name="Combined Decision">
            <informationRequirement>
              <requiredDecision href="#missing-decision"/>
            </informationRequirement>
            <decisionTable id="dt1">
              <input id="i1"><inputExpression id="ie1" typeRef="string">
                <text>input</text></inputExpression></input>
              <output id="o1" typeRef="string" name="result"/>
            </decisionTable>
          </decision>
        </definitions>
        """;

    private static final String CMMN_WITH_PROCESS_REF = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL"
                     targetNamespace="http://example.com">
          <case id="card-controls-case" name="Card Controls Case">
            <casePlanModel id="cmp1" name="Card Controls">
              <processTask id="pt1" name="Evaluate Request"
                           processRef="card-controls-process"/>
              <processTask id="pt2" name="Apply Changes"
                           processRef="apply-card-changes"/>
            </casePlanModel>
          </case>
        </definitions>
        """;

    private static final String CMMN_WITH_DECISION_REF = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL"
                     targetNamespace="http://example.com">
          <case id="case-with-decision" name="Case With Decision">
            <casePlanModel id="cmp1" name="Plan">
              <decisionTask id="dt1" name="Threshold Check"
                            decisionRef="card-control-thresholds"/>
            </casePlanModel>
          </case>
        </definitions>
        """;

    private static final String EVENT_JSON = """
        {
          "key": "expense-submitted",
          "name": "Expense Submitted"
        }
        """;

    private BundleFile createFile(Long id, String filename, String content) {
        BundleFile file = new BundleFile();
        file.setId(id);
        file.setFilename(filename);
        file.setMimeType("application/xml");
        file.setContent(content.getBytes(StandardCharsets.UTF_8));
        file.setEntrypoint(false);
        return file;
    }

    private DecisioningBundle createBundle(BundleFile... files) {
        DecisioningBundle bundle = new DecisioningBundle();
        bundle.setId(1L);
        bundle.setBundleType(BundleType.EXPENSE_APPROVAL);
        bundle.setStatus(BundleStatus.DRAFT);
        for (BundleFile file : files) {
            bundle.addFile(file);
            file.setBundle(bundle);
        }
        return bundle;
    }

    @Test
    void validBundleWithNoMissingReferences() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "main.bpmn", BPMN_VALID),
            createFile(2L, "rules.dmn", DMN_VALID));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void missingCallActivityCalledElement() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "main.bpmn", BPMN_WITH_CALL_ACTIVITY));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(1);
        ValidationError error = errors.get(0);
        assertThat(error.fileType()).isEqualTo("BPMN");
        assertThat(error.elementType()).isEqualTo("callActivity");
        assertThat(error.missingReference()).isEqualTo("subprocess-invoice");
        assertThat(error.referenceAttribute()).isEqualTo("calledElement");
        assertThat(error.suggestion()).contains("subprocess-invoice");
    }

    @Test
    void callActivityResolvedWhenSubprocessPresent() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "main.bpmn", BPMN_WITH_CALL_ACTIVITY),
            createFile(2L, "subprocess.bpmn", BPMN_SUBPROCESS));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void missingBusinessRuleTaskDecisionRef() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "expense.bpmn", BPMN_WITH_BUSINESS_RULE_TASK));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(1);
        ValidationError error = errors.get(0);
        assertThat(error.elementType()).isEqualTo("businessRuleTask");
        assertThat(error.missingReference()).isEqualTo("travel-check");
        assertThat(error.referenceAttribute()).isEqualTo("decisionRef");
        assertThat(error.suggestion()).contains("travel-check");
    }

    @Test
    void businessRuleTaskResolvedWhenDmnPresent() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "expense.bpmn", BPMN_WITH_BUSINESS_RULE_TASK),
            createFile(2L, "rules.dmn", DMN_VALID));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void missingEventRef() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "event-process.bpmn", BPMN_WITH_EVENT_REF));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(1);
        ValidationError error = errors.get(0);
        assertThat(error.missingReference()).isEqualTo("expense-submitted");
        assertThat(error.referenceAttribute()).isEqualTo("eventRef");
        assertThat(error.suggestion()).contains("expense-submitted");
    }

    @Test
    void eventRefResolvedWhenEventFilePresent() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "event-process.bpmn", BPMN_WITH_EVENT_REF),
            createFile(2L, "expense-submitted.event", EVENT_JSON));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void missingCmmnProcessRef() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "case.cmmn", CMMN_WITH_PROCESS_REF));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(2);
        assertThat(errors).allMatch(e -> "processTask".equals(e.elementType()));
        assertThat(errors).extracting(ValidationError::missingReference)
            .containsExactlyInAnyOrder("card-controls-process", "apply-card-changes");
    }

    @Test
    void cmmnProcessRefResolvedWhenBpmnPresent() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "case.cmmn", CMMN_WITH_PROCESS_REF),
            createFile(2L, "card-controls.bpmn", """
                <?xml version="1.0" encoding="UTF-8"?>
                <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                             targetNamespace="http://example.com">
                  <process id="card-controls-process" name="Card Controls" isExecutable="true">
                    <startEvent id="start"/>
                    <endEvent id="end"/>
                  </process>
                </definitions>
                """),
            createFile(3L, "apply.bpmn", """
                <?xml version="1.0" encoding="UTF-8"?>
                <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                             targetNamespace="http://example.com">
                  <process id="apply-card-changes" name="Apply Changes" isExecutable="true">
                    <startEvent id="start"/>
                    <endEvent id="end"/>
                  </process>
                </definitions>
                """));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void missingCmmnDecisionRef() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "case.cmmn", CMMN_WITH_DECISION_REF));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(1);
        ValidationError error = errors.get(0);
        assertThat(error.elementType()).isEqualTo("decisionTask");
        assertThat(error.missingReference()).isEqualTo("card-control-thresholds");
        assertThat(error.referenceAttribute()).isEqualTo("decisionRef");
    }

    @Test
    void missingDmnRequiredDecision() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "rules.dmn", DMN_WITH_REQUIRED_DECISION));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(1);
        ValidationError error = errors.get(0);
        assertThat(error.elementType()).isEqualTo("decision");
        assertThat(error.missingReference()).isEqualTo("missing-decision");
        assertThat(error.referenceAttribute()).isEqualTo("decisionRef");
    }

    @Test
    void dmnRequiredDecisionResolvedWhenPresent() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "rules.dmn", DMN_WITH_REQUIRED_DECISION),
            createFile(2L, "extra.dmn", """
                <?xml version="1.0" encoding="UTF-8"?>
                <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                             id="definitions" name="Decisions">
                  <decision id="missing-decision" name="Missing Decision">
                    <decisionTable id="dt1">
                      <input id="i1"><inputExpression id="ie1" typeRef="string">
                        <text>input</text></inputExpression></input>
                      <output id="o1" typeRef="string" name="result"/>
                    </decisionTable>
                  </decision>
                </definitions>
                """));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void multipleErrorsAcrossFiles() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "main.bpmn", BPMN_WITH_CALL_ACTIVITY),
            createFile(2L, "expense.bpmn", BPMN_WITH_BUSINESS_RULE_TASK));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(2);
        assertThat(errors).extracting(ValidationError::missingReference)
            .containsExactlyInAnyOrder("subprocess-invoice", "travel-check");
    }

    @Test
    void emptyBundleReturnsNoErrors() {
        DecisioningBundle bundle = createBundle();

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void nullBundleReturnsNoErrors() {
        List<ValidationError> errors = validator.validate(null);

        assertThat(errors).isEmpty();
    }

    @Test
    void nonXmlFilesAreIgnored() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "readme.txt", "This is not XML"));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).isEmpty();
    }

    @Test
    void validationErrorContainsAllStructuredFields() {
        DecisioningBundle bundle = createBundle(
            createFile(1L, "main.bpmn", BPMN_WITH_CALL_ACTIVITY));

        List<ValidationError> errors = validator.validate(bundle);

        assertThat(errors).hasSize(1);
        ValidationError error = errors.get(0);
        assertThat(error.fileId()).isEqualTo(1L);
        assertThat(error.filename()).isEqualTo("main.bpmn");
        assertThat(error.fileType()).isEqualTo("BPMN");
        assertThat(error.elementType()).isEqualTo("callActivity");
        assertThat(error.elementName()).isEqualTo("Approve Invoice");
        assertThat(error.elementId()).isEqualTo("callSub");
        assertThat(error.missingReference()).isEqualTo("subprocess-invoice");
        assertThat(error.referenceAttribute()).isEqualTo("calledElement");
        assertThat(error.suggestion()).isNotEmpty();
    }
}
