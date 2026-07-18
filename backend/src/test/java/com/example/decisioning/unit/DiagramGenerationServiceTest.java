package com.example.decisioning.unit;

import com.example.decisioning.service.DiagramGenerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class DiagramGenerationServiceTest {

    private DiagramGenerationService service;

    @BeforeEach
    void setUp() {
        service = new DiagramGenerationService("RIGHT", 40.0, 60.0);
    }

    private static final String BPMN_WITHOUT_DI = """
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

    private static final String BPMN_WITH_DI = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                     xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
                     targetNamespace="http://example.com">
          <process id="expense-approval" name="Expense Approval" isExecutable="true">
            <startEvent id="start" name="Start"/>
            <endEvent id="end" name="End"/>
            <sequenceFlow id="flow1" sourceRef="start" targetRef="end"/>
          </process>
          <BPMNDiagram id="BPMNDiagram_1">
            <BPMNPlane id="BPMNPlane_1" bpmnElement="expense-approval">
              <BPMNShape id="BPMNShape_start" bpmnElement="start">
                <omgdc:Bounds x="100" y="100" width="30" height="30"/>
              </BPMNShape>
            </BPMNPlane>
          </BPMNDiagram>
        </definitions>
        """;

    private static final String CMMN_WITHOUT_DI = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL"
                     targetNamespace="http://example.com">
          <case id="card-controls-case" name="Card Controls Case">
            <casePlanModel id="cmp1" name="Card Controls">
              <planItem id="pi1" definitionRef="ht1"/>
              <planItem id="pi2" definitionRef="pt1"/>
              <humanTask id="ht1" name="Manager Review"/>
              <processTask id="pt1" name="Evaluate Request" processRef="card-controls-process"/>
            </casePlanModel>
          </case>
        </definitions>
        """;

    private static final String DMN_WITHOUT_DI = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                     id="definitions" name="Decisions">
          <decision id="travel-check" name="Travel Check">
            <decisionTable id="dt1">
              <input id="i1" label="Has Travel">
                <inputExpression id="ie1" typeRef="boolean">
                  <text>hasTravel</text>
                </inputExpression>
              </input>
              <output id="o1" label="Approval Path" typeRef="string" name="approvalPath"/>
              <rule id="r1">
                <inputEntry id="ie_r1"><text>true</text></inputEntry>
                <outputEntry id="oe_r1"><text>"DIRECTOR"</text></outputEntry>
              </rule>
              <rule id="r2">
                <inputEntry id="ie_r2"><text>false</text></inputEntry>
                <outputEntry id="oe_r2"><text>"STANDARD"</text></outputEntry>
              </rule>
            </decisionTable>
          </decision>
        </definitions>
        """;

    @Test
    void enrichBpmnWithoutDiAddsDiagramInfo() {
        byte[] input = BPMN_WITHOUT_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "expense.bpmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("expense-approval");
        assertThat(resultXml).isNotEqualTo(BPMN_WITHOUT_DI);
    }

    @Test
    void enrichBpmnWithExistingDiIsUnchanged() {
        byte[] input = BPMN_WITH_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "expense.bpmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("BPMNDiagram");
        assertThat(resultXml).contains("BPMNShape");
    }

    @Test
    void enrichCmmnWithoutDiAddsDiagramInfo() {
        byte[] input = CMMN_WITHOUT_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "card-controls.cmmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("card-controls-case");
    }

    @Test
    void enrichDmnProcessesWithoutError() {
        byte[] input = DMN_WITHOUT_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "travel-check.dmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("travel-check");
    }

    @Test
    void enrichNonXmlFileReturnsContentUnchanged() {
        byte[] input = "Hello World".getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "readme.txt");
        assertThat(result).isEqualTo(input);
    }

    @Test
    void enrichWithNullFilenameReturnsContentUnchanged() {
        byte[] input = "<xml/>".getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, null);
        assertThat(result).isEqualTo(input);
    }

    @Test
    void enrichBpmnWithMultipleFlowNodes() {
        String bpmn = """
            <?xml version="1.0" encoding="UTF-8"?>
            <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                         targetNamespace="http://example.com">
              <process id="complex" name="Complex Process" isExecutable="true">
                <startEvent id="start" name="Start"/>
                <userTask id="task1" name="Task 1"/>
                <userTask id="task2" name="Task 2"/>
                <exclusiveGateway id="gw1" name="Decision"/>
                <endEvent id="end1" name="End 1"/>
                <endEvent id="end2" name="End 2"/>
                <sequenceFlow id="f1" sourceRef="start" targetRef="task1"/>
                <sequenceFlow id="f2" sourceRef="task1" targetRef="gw1"/>
                <sequenceFlow id="f3" sourceRef="gw1" targetRef="task2"/>
                <sequenceFlow id="f4" sourceRef="gw1" targetRef="end1"/>
                <sequenceFlow id="f5" sourceRef="task2" targetRef="end2"/>
              </process>
            </definitions>
            """;
        byte[] input = bpmn.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "complex.bpmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("complex");
    }

    @Test
    void enrichBpmnWithBpmn20XmlExtension() {
        byte[] input = BPMN_WITHOUT_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "expense.bpmn20.xml");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).isNotEmpty();
    }

    @Test
    void enrichHandlesInvalidXmlGracefully() {
        byte[] input = "NOT VALID XML".getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "invalid.bpmn");
        assertThat(result).isEqualTo(input);
    }

    @Test
    void enrichDmnWithMultipleDecisions() {
        String dmn = """
            <?xml version="1.0" encoding="UTF-8"?>
            <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                         id="definitions" name="Decisions">
              <decision id="travel-check" name="Travel Check">
                <decisionTable id="dt1">
                  <input id="i1"><inputExpression id="ie1" typeRef="boolean">
                    <text>hasTravel</text></inputExpression></input>
                  <output id="o1" typeRef="string" name="path"/>
                  <rule id="r1"><inputEntry id="ie_r1"><text>true</text></inputEntry>
                    <outputEntry id="oe_r1"><text>"DIRECTOR"</text></outputEntry></rule>
                </decisionTable>
              </decision>
              <decision id="amount-check" name="Amount Check">
                <decisionTable id="dt2">
                  <input id="i2"><inputExpression id="ie2" typeRef="number">
                    <text>amount</text></inputExpression></input>
                  <output id="o2" typeRef="string" name="level"/>
                  <rule id="r2"><inputEntry id="ie_r2"><text>&lt;500</text></inputEntry>
                    <outputEntry id="oe_r2"><text>"AUTO"</text></outputEntry></rule>
                </decisionTable>
              </decision>
            </definitions>
            """;
        byte[] input = dmn.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "decisions.dmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("travel-check");
        assertThat(resultXml).contains("amount-check");
    }

    @Test
    void enrichDmnWithRequiredDecisionsCreatesEdges() {
        String dmn = """
            <?xml version="1.0" encoding="UTF-8"?>
            <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                         id="definitions" name="Decisions">
              <decision id="base-decision" name="Base Decision">
                <decisionTable id="dt1">
                  <input id="i1"><inputExpression id="ie1" typeRef="string">
                    <text>input1</text></inputExpression></input>
                  <output id="o1" typeRef="string" name="result"/>
                  <rule id="r1"><inputEntry id="ie_r1"><text>"A"</text></inputEntry>
                    <outputEntry id="oe_r1"><text>"yes"</text></outputEntry></rule>
                </decisionTable>
              </decision>
              <decision id="final-decision" name="Final Decision">
                <informationRequirement>
                  <requiredDecision href="#base-decision"/>
                </informationRequirement>
                <decisionTable id="dt2">
                  <input id="i2"><inputExpression id="ie2" typeRef="string">
                    <text>input2</text></inputExpression></input>
                  <output id="o2" typeRef="string" name="final"/>
                  <rule id="r2"><inputEntry id="ie_r2"><text>"A"</text></inputEntry>
                    <outputEntry id="oe_r2"><text>"done"</text></outputEntry></rule>
                </decisionTable>
              </decision>
            </definitions>
            """;
        byte[] input = dmn.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "decisions.dmn");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("base-decision");
        assertThat(resultXml).contains("final-decision");
    }

    @Test
    void enrichCmmnWithCmmnXmlExtension() {
        byte[] input = CMMN_WITHOUT_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "card-controls.cmmn.xml");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("card-controls-case");
    }

    @Test
    void enrichDmnWithDmnXmlExtension() {
        byte[] input = DMN_WITHOUT_DI.getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "travel-check.dmn.xml");

        String resultXml = new String(result, StandardCharsets.UTF_8);
        assertThat(resultXml).contains("travel-check");
    }

    @Test
    void enrichCmmnHandlesInvalidXmlGracefully() {
        byte[] input = "NOT VALID XML".getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "invalid.cmmn");
        assertThat(result).isEqualTo(input);
    }

    @Test
    void enrichDmnHandlesInvalidXmlGracefully() {
        byte[] input = "NOT VALID XML".getBytes(StandardCharsets.UTF_8);
        byte[] result = service.enrichWithDiagrams(input, "invalid.dmn");
        assertThat(result).isEqualTo(input);
    }
}
