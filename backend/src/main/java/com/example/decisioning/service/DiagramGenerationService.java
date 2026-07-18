package com.example.decisioning.service;

import org.eclipse.elk.core.RecursiveGraphLayoutEngine;
import org.eclipse.elk.core.options.CoreOptions;
import org.eclipse.elk.core.options.Direction;
import org.eclipse.elk.core.util.BasicProgressMonitor;
import org.eclipse.elk.graph.ElkEdge;
import org.eclipse.elk.graph.ElkNode;
import org.eclipse.elk.graph.util.ElkGraphUtil;
import org.flowable.bpmn.converter.BpmnXMLConverter;
import org.flowable.bpmn.model.BpmnModel;
import org.flowable.bpmn.model.FlowElement;
import org.flowable.bpmn.model.GraphicInfo;
import org.flowable.bpmn.model.Process;
import org.flowable.bpmn.model.SequenceFlow;
import org.flowable.cmmn.converter.CmmnXmlConverter;
import org.flowable.cmmn.model.Case;
import org.flowable.cmmn.model.CmmnModel;
import org.flowable.cmmn.model.PlanItem;
import org.flowable.cmmn.model.Stage;
import org.flowable.common.engine.api.io.InputStreamProvider;
import org.flowable.dmn.model.Decision;
import org.flowable.dmn.model.DmnDefinition;
import org.flowable.dmn.model.DmnElementReference;
import org.flowable.dmn.model.InformationRequirement;
import org.flowable.dmn.xml.converter.DmnXMLConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DiagramGenerationService {

    private static final String ELK_LAYERED_ALGORITHM_ID = "org.eclipse.elk.layered";

    private final Direction direction;
    private final double spacing;
    private final double layerSpacing;

    public DiagramGenerationService(
        @Value("${diagram.elk.direction:RIGHT}") String direction,
        @Value("${diagram.elk.spacing:40.0}") double spacing,
        @Value("${diagram.elk.layer-spacing:60.0}") double layerSpacing) {
        this.direction = Direction.valueOf(direction);
        this.spacing = spacing;
        this.layerSpacing = layerSpacing;
    }

    public byte[] enrichWithDiagrams(byte[] content, String filename) {
        if (filename == null) {
            return content;
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".bpmn") || lower.endsWith(".bpmn20.xml")) {
            return enrichBpmn(content);
        }
        if (lower.endsWith(".cmmn") || lower.endsWith(".cmmn.xml")) {
            return enrichCmmn(content);
        }
        if (lower.endsWith(".dmn") || lower.endsWith(".dmn.xml")) {
            return enrichDmn(content);
        }
        return content;
    }

    private byte[] enrichBpmn(byte[] content) {
        try {
            BpmnXMLConverter converter = new BpmnXMLConverter();
            BpmnModel model = converter.convertToBpmnModel(
                toInputStreamProvider(content), false, false);

            if (!model.getLocationMap().isEmpty()) {
                return content;
            }

            ElkNode rootNode = buildBpmnElkGraph(model);
            runLayout(rootNode);
            applyBpmnLayout(model, rootNode);
            return converter.convertToXML(model);
        } catch (Exception e) {
            return content;
        }
    }

    private ElkNode buildBpmnElkGraph(BpmnModel model) {
        ElkNode rootNode = createConfiguredRootNode();

        Map<String, ElkNode> nodeMap = new HashMap<>();
        for (Process process : model.getProcesses()) {
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof SequenceFlow) {
                    continue;
                }
                ElkNode node = ElkGraphUtil.createNode(rootNode);
                node.setIdentifier(element.getId());
                node.setWidth(100);
                node.setHeight(60);
                nodeMap.put(element.getId(), node);
            }
            for (FlowElement element : process.getFlowElements()) {
                if (element instanceof SequenceFlow seqFlow) {
                    ElkNode source = nodeMap.get(seqFlow.getSourceRef());
                    ElkNode target = nodeMap.get(seqFlow.getTargetRef());
                    if (source != null && target != null) {
                        ElkEdge edge = ElkGraphUtil.createSimpleEdge(source, target);
                        edge.setIdentifier(seqFlow.getId());
                    }
                }
            }
        }
        return rootNode;
    }

    private void applyBpmnLayout(BpmnModel model, ElkNode rootNode) {
        for (ElkNode child : rootNode.getChildren()) {
            GraphicInfo gi = new GraphicInfo();
            gi.setX(child.getX());
            gi.setY(child.getY());
            gi.setWidth(child.getWidth());
            gi.setHeight(child.getHeight());
            model.addGraphicInfo(child.getIdentifier(), gi);
        }
        for (ElkEdge edge : rootNode.getContainedEdges()) {
            ElkNode source = (ElkNode) edge.getSources().get(0);
            ElkNode target = (ElkNode) edge.getTargets().get(0);
            List<GraphicInfo> flowLocations = new ArrayList<>();
            GraphicInfo sourceGi = new GraphicInfo();
            sourceGi.setX(source.getX() + source.getWidth());
            sourceGi.setY(source.getY() + source.getHeight() / 2);
            flowLocations.add(sourceGi);
            GraphicInfo targetGi = new GraphicInfo();
            targetGi.setX(target.getX());
            targetGi.setY(target.getY() + target.getHeight() / 2);
            flowLocations.add(targetGi);
            model.addFlowGraphicInfoList(edge.getIdentifier(), flowLocations);
        }
    }

    private byte[] enrichCmmn(byte[] content) {
        try {
            CmmnXmlConverter converter = new CmmnXmlConverter();
            CmmnModel model = converter.convertToCmmnModel(toInputStreamProvider(content));

            if (!model.getLocationMap().isEmpty()) {
                return content;
            }

            ElkNode rootNode = buildCmmnElkGraph(model);
            runLayout(rootNode);
            applyCmmnLayout(model, rootNode);
            return converter.convertToXML(model);
        } catch (Exception e) {
            return content;
        }
    }

    private ElkNode buildCmmnElkGraph(CmmnModel model) {
        ElkNode rootNode = createConfiguredRootNode();

        Map<String, ElkNode> nodeMap = new HashMap<>();
        for (Case caze : model.getCases()) {
            Stage planModel = caze.getPlanModel();
            if (planModel != null) {
                for (PlanItem planItem : planModel.getPlanItems()) {
                    String id = planItem.getId();
                    if (id == null || nodeMap.containsKey(id)) {
                        continue;
                    }
                    ElkNode node = ElkGraphUtil.createNode(rootNode);
                    node.setIdentifier(id);
                    node.setWidth(120);
                    node.setHeight(60);
                    nodeMap.put(id, node);
                }
            }
        }
        return rootNode;
    }

    private void applyCmmnLayout(CmmnModel model, ElkNode rootNode) {
        for (ElkNode child : rootNode.getChildren()) {
            org.flowable.cmmn.model.GraphicInfo gi =
                new org.flowable.cmmn.model.GraphicInfo();
            gi.setX(child.getX());
            gi.setY(child.getY());
            gi.setWidth(child.getWidth());
            gi.setHeight(child.getHeight());
            model.addGraphicInfo(child.getIdentifier(), gi);
        }
    }

    private byte[] enrichDmn(byte[] content) {
        try {
            DmnXMLConverter converter = new DmnXMLConverter();
            DmnDefinition definition = converter.convertToDmnModel(
                toInputStreamProvider(content), false, false);

            ElkNode rootNode = buildDmnDrgElkGraph(definition);
            if (!rootNode.getChildren().isEmpty()) {
                runLayout(rootNode);
            }
            applyDmnLayout(definition, rootNode);

            return converter.convertToXML(definition);
        } catch (Exception e) {
            return content;
        }
    }

    private ElkNode buildDmnDrgElkGraph(DmnDefinition definition) {
        ElkNode rootNode = createConfiguredRootNode();

        Map<String, ElkNode> nodeMap = new HashMap<>();
        for (Decision decision : definition.getDecisions()) {
            ElkNode node = ElkGraphUtil.createNode(rootNode);
            node.setIdentifier(decision.getId());
            node.setWidth(120);
            node.setHeight(60);
            nodeMap.put(decision.getId(), node);
        }
        for (Decision decision : definition.getDecisions()) {
            if (decision.getRequiredDecisions() != null) {
                for (InformationRequirement req : decision.getRequiredDecisions()) {
                    DmnElementReference ref = req.getRequiredDecision();
                    if (ref == null) {
                        continue;
                    }
                    String reqId = ref.getParsedId();
                    if (reqId == null || reqId.isEmpty()) {
                        String href = ref.getHref();
                        reqId = href != null && href.startsWith("#")
                            ? href.substring(1) : href;
                    }
                    ElkNode source = nodeMap.get(reqId);
                    ElkNode target = nodeMap.get(decision.getId());
                    if (source != null && target != null) {
                        ElkGraphUtil.createSimpleEdge(source, target);
                    }
                }
            }
        }
        return rootNode;
    }

    private void applyDmnLayout(DmnDefinition definition, ElkNode rootNode) {
        for (ElkNode child : rootNode.getChildren()) {
            org.flowable.dmn.model.GraphicInfo gi =
                new org.flowable.dmn.model.GraphicInfo();
            gi.setX(child.getX());
            gi.setY(child.getY());
            gi.setWidth(child.getWidth());
            gi.setHeight(child.getHeight());
            definition.addGraphicInfo(child.getIdentifier(), gi);
        }
    }

    private ElkNode createConfiguredRootNode() {
        ElkNode rootNode = ElkGraphUtil.createGraph();
        rootNode.setProperty(CoreOptions.ALGORITHM, ELK_LAYERED_ALGORITHM_ID);
        rootNode.setProperty(CoreOptions.DIRECTION, direction);
        rootNode.setProperty(CoreOptions.SPACING_NODE_NODE, spacing);
        rootNode.setProperty(
            org.eclipse.elk.alg.layered.options.LayeredOptions.SPACING_EDGE_NODE_BETWEEN_LAYERS,
            layerSpacing);
        rootNode.setProperty(
            org.eclipse.elk.alg.layered.options.LayeredOptions.SPACING_NODE_NODE_BETWEEN_LAYERS,
            layerSpacing);
        return rootNode;
    }

    private void runLayout(ElkNode rootNode) {
        RecursiveGraphLayoutEngine engine = new RecursiveGraphLayoutEngine();
        engine.layout(rootNode, new BasicProgressMonitor());
    }

    private InputStreamProvider toInputStreamProvider(byte[] content) {
        return new InputStreamProvider() {
            @Override
            public InputStream getInputStream() {
                return new ByteArrayInputStream(content);
            }
        };
    }
}
