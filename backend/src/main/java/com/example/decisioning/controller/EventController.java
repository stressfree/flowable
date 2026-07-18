package com.example.decisioning.controller;

import com.example.decisioning.dto.EventDefinitionResponse;
import com.example.decisioning.dto.SendEventRequest;
import com.example.decisioning.service.EventRegistryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/bundles/{bundleId}/events")
public class EventController {

    private final EventRegistryService eventRegistryService;

    public EventController(EventRegistryService eventRegistryService) {
        this.eventRegistryService = eventRegistryService;
    }

    @GetMapping
    public List<EventDefinitionResponse> getEventDefinitions(@PathVariable Long bundleId) {
        return eventRegistryService.getEventDefinitions(bundleId);
    }

    @PostMapping("/{eventKey}/send")
    public ResponseEntity<Void> sendEvent(
        @PathVariable Long bundleId,
        @PathVariable String eventKey,
        @RequestBody SendEventRequest request) {
        eventRegistryService.sendEvent(bundleId, eventKey, request.payload());
        return ResponseEntity.ok().build();
    }
}
