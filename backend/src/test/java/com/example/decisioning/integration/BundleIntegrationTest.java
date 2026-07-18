package com.example.decisioning.integration;

import com.example.decisioning.dto.CompanyRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class BundleIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("decisioning")
        .withUsername("decisioning")
        .withPassword("decisioning")
        .withInitScript("init-flowable-schema.sql");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("flowable.database-schema", () -> "public");
        registry.add("flowable.event-registry.database-schema", () -> "public");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    private RestClient restClient;

    private static final String VALID_BPMN = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                     targetNamespace="http://example.com">
          <process id="expense-approval" name="Expense Approval" isExecutable="true">
            <startEvent id="start" name="Start"/>
            <endEvent id="end" name="End"/>
            <sequenceFlow id="flow1" sourceRef="start" targetRef="end"/>
          </process>
        </definitions>
        """;

    private static final String VALID_DMN = """
        <?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"
                     id="definitions" name="Decisions">
          <decision id="travel-check" name="Travel Check">
            <decisionTable id="decisionTable">
              <input id="input1" label="Has Travel">
                <inputExpression id="inputExpression1" typeRef="boolean">
                  <text>hasTravel</text>
                </inputExpression>
              </input>
              <output id="output1" label="Approval Path" typeRef="string"
                      name="approvalPath"/>
              <rule id="rule1">
                <inputEntry id="inputEntry1"><text>true</text></inputEntry>
                <outputEntry id="outputEntry1"><text>"DIRECTOR"</text></outputEntry>
              </rule>
              <rule id="rule2">
                <inputEntry id="inputEntry2"><text>false</text></inputEntry>
                <outputEntry id="outputEntry2"><text>"STANDARD"</text></outputEntry>
              </rule>
            </decisionTable>
          </decision>
        </definitions>
        """;

    @BeforeEach
    void setUp() {
        restClient = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .build();
        cleanupBundles();
        cleanupCompanies();
    }

    private void cleanupBundles() {
        try {
            ResponseEntity<List> response = restClient.get()
                .uri("/v1/bundles")
                .retrieve()
                .toEntity(List.class);
            if (response.getBody() != null) {
                for (Object bundle : response.getBody()) {
                    Map<?, ?> b = (Map<?, ?>) bundle;
                    Long id = ((Number) b.get("id")).longValue();
                    restClient.delete()
                        .uri("/v1/bundles/" + id)
                        .retrieve()
                        .onStatus(s -> true, (req, res) -> {})
                        .toBodilessEntity();
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void cleanupCompanies() {
        try {
            ResponseEntity<List> response = restClient.get()
                .uri("/v1/companies")
                .retrieve()
                .toEntity(List.class);
            if (response.getBody() != null) {
                for (Object company : response.getBody()) {
                    Map<?, ?> c = (Map<?, ?>) company;
                    Long id = ((Number) c.get("id")).longValue();
                    restClient.delete()
                        .uri("/v1/companies/" + id)
                        .retrieve()
                        .onStatus(s -> true, (req, res) -> {})
                        .toBodilessEntity();
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Test
    void createBundleReturns201WithFilesArray() {
        Long companyId = createCompany("Acme Corp");

        ResponseEntity<Map> response = createBundle(
            companyId, "EXPENSE_APPROVAL", "Test bundle", "expense.bpmn", VALID_BPMN);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Object> body = response.getBody();
        assertThat(body.get("bundleType")).isEqualTo("EXPENSE_APPROVAL");
        assertThat(body.get("status")).isEqualTo("DRAFT");
        assertThat(body.get("companyId")).isEqualTo(companyId.intValue());
        List<?> files = (List<?>) body.get("files");
        assertThat(files).hasSize(1);
        Map<?, ?> file = (Map<?, ?>) files.get(0);
        assertThat(file.get("filename")).isEqualTo("expense.bpmn");
        assertThat(file.get("isEntrypoint")).isEqualTo(true);
    }

    @Test
    void createBundleWithMultipleFiles() {
        ResponseEntity<Map> response = createBundle(
            null, "EXPENSE_APPROVAL", "Multi-file bundle",
            new String[]{"expense.bpmn", "travel-check.dmn"},
            new String[]{VALID_BPMN, VALID_DMN});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        List<?> files = (List<?>) response.getBody().get("files");
        assertThat(files).hasSize(2);
        assertThat(((Map<?, ?>) files.get(0)).get("isEntrypoint")).isEqualTo(true);
        assertThat(((Map<?, ?>) files.get(1)).get("isEntrypoint")).isEqualTo(false);
    }

    @Test
    void getBundleReturns200WithFilesArray() {
        Long bundleId = createBundleAndGetId(
            null, "EXPENSE_APPROVAL", "Test", "main.bpmn", VALID_BPMN);

        ResponseEntity<Map> response = restClient.get()
            .uri("/v1/bundles/" + bundleId)
            .retrieve()
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> files = (List<?>) response.getBody().get("files");
        assertThat(files).hasSize(1);
    }

    @Test
    void getBundleNotFoundReturns404() {
        ResponseEntity<Map> response = restClient.get()
            .uri("/v1/bundles/9999")
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("detail").toString()).contains("9999");
    }

    @Test
    void listBundlesReturns200() {
        createBundleAndGetId(null, "EXPENSE_APPROVAL", "Bundle 1", "a.bpmn", VALID_BPMN);
        createBundleAndGetId(null, "VIRTUAL_CARD_APPROVAL", "Bundle 2", "b.bpmn", VALID_BPMN);

        ResponseEntity<List> response = restClient.get()
            .uri("/v1/bundles")
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void listBundlesFilterByBundleType() {
        createBundleAndGetId(null, "EXPENSE_APPROVAL", "Expense", "a.bpmn", VALID_BPMN);
        createBundleAndGetId(null, "VIRTUAL_CARD_APPROVAL", "Virtual Card", "b.bpmn", VALID_BPMN);

        ResponseEntity<List> response = restClient.get()
            .uri(builder -> builder.path("/v1/bundles").queryParam("bundleType", "EXPENSE_APPROVAL").build())
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        Map<?, ?> item = (Map<?, ?>) response.getBody().get(0);
        assertThat(item.get("bundleType")).isEqualTo("EXPENSE_APPROVAL");
    }

    @Test
    void listBundlesFilterByStatus() {
        createBundleAndGetId(null, "EXPENSE_APPROVAL", "Draft Bundle", "a.bpmn", VALID_BPMN);

        ResponseEntity<List> response = restClient.get()
            .uri(builder -> builder.path("/v1/bundles").queryParam("status", "DRAFT").build())
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSizeGreaterThanOrEqualTo(1);
        Map<?, ?> item = (Map<?, ?>) response.getBody().get(0);
        assertThat(item.get("status")).isEqualTo("DRAFT");
    }

    @Test
    void listBundlesFilterByCompanyId() {
        Long acmeId = createCompany("Acme Corp");
        Long betaId = createCompany("Beta Inc");
        createBundleAndGetId(acmeId, "EXPENSE_APPROVAL", "Acme Bundle", "a.bpmn", VALID_BPMN);
        createBundleAndGetId(betaId, "EXPENSE_APPROVAL", "Beta Bundle", "b.bpmn", VALID_BPMN);

        ResponseEntity<List> response = restClient.get()
            .uri(builder -> builder.path("/v1/bundles").queryParam("companyId", acmeId).build())
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    void addFilesToBundleReturns200() {
        Long bundleId = createBundleAndGetId(
            null, "EXPENSE_APPROVAL", "Test", "main.bpmn", VALID_BPMN);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("files", createFileResource("extra.dmn", VALID_DMN));

        ResponseEntity<Map> response = restClient.post()
            .uri("/v1/bundles/" + bundleId + "/files")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(body)
            .retrieve()
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> files = (List<?>) response.getBody().get("files");
        assertThat(files).hasSize(2);
    }

    @Test
    void setEntrypointReturns200() {
        Long bundleId = createBundleAndGetId(
            null, "EXPENSE_APPROVAL", "Test",
            new String[]{"main.bpmn", "rules.dmn"},
            new String[]{VALID_BPMN, VALID_DMN});

        Long secondFileId = null;
        ResponseEntity<Map> getResponse = restClient.get()
            .uri("/v1/bundles/" + bundleId)
            .retrieve()
            .toEntity(Map.class);
        List<?> files = (List<?>) getResponse.getBody().get("files");
        for (Object f : files) {
            Map<?, ?> fileMap = (Map<?, ?>) f;
            if (fileMap.get("filename").equals("rules.dmn")) {
                secondFileId = ((Number) fileMap.get("id")).longValue();
            }
        }

        ResponseEntity<Map> response = restClient.put()
            .uri("/v1/bundles/" + bundleId + "/entrypoint")
            .contentType(MediaType.APPLICATION_JSON)
            .body("{\"fileId\":" + secondFileId + "}")
            .retrieve()
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> updatedFiles = (List<?>) response.getBody().get("files");
        Map<?, ?> newEntrypoint = (Map<?, ?>) updatedFiles.stream()
            .filter(f -> ((Map<?, ?>) f).get("filename").equals("rules.dmn"))
            .findFirst().orElseThrow();
        assertThat(newEntrypoint.get("isEntrypoint")).isEqualTo(true);
    }

    @Test
    void getFileContentReturns200() {
        Long bundleId = createBundleAndGetId(
            null, "EXPENSE_APPROVAL", "Test", "main.bpmn", VALID_BPMN);

        ResponseEntity<Map> getResponse = restClient.get()
            .uri("/v1/bundles/" + bundleId)
            .retrieve()
            .toEntity(Map.class);
        Long fileId = ((Number) ((Map<?, ?>) ((List<?>) getResponse.getBody().get("files"))
            .get(0)).get("id")).longValue();

        ResponseEntity<String> response = restClient.get()
            .uri("/v1/bundles/" + bundleId + "/files/" + fileId)
            .retrieve()
            .toEntity(String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("expense-approval");
    }

    @Test
    void deleteBundleReturns204() {
        Long bundleId = createBundleAndGetId(
            null, "EXPENSE_APPROVAL", "Test", "main.bpmn", VALID_BPMN);

        restClient.delete()
            .uri("/v1/bundles/" + bundleId)
            .retrieve()
            .toBodilessEntity();

        ResponseEntity<Map> checkResponse = restClient.get()
            .uri("/v1/bundles/" + bundleId)
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toEntity(Map.class);
        assertThat(checkResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void deleteBundleNotFoundReturns404() {
        ResponseEntity<Void> response = restClient.delete()
            .uri("/v1/bundles/9999")
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toBodilessEntity();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void createBundleWithNonExistentCompanyReturns404() {
        ResponseEntity<Map> response = createBundle(
            9999L, "EXPENSE_APPROVAL", "Test", "main.bpmn", VALID_BPMN);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("detail").toString()).contains("9999");
    }

    @Test
    void getBundleTypesReturns200() {
        ResponseEntity<List> response = restClient.get()
            .uri("/v1/bundle-types")
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(4);
    }

    private Long createCompany(String name) {
        try {
            CompanyRequest request = new CompanyRequest(name, null);
            ResponseEntity<Map> response = restClient.post()
                .uri("/v1/companies")
                .contentType(MediaType.APPLICATION_JSON)
                .body(objectMapper.writeValueAsString(request))
                .retrieve()
                .toEntity(Map.class);
            return ((Number) response.getBody().get("id")).longValue();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private ResponseEntity<Map> createBundle(Long companyId, String bundleType,
                                               String description, String filename, String content) {
        return createBundle(companyId, bundleType, description,
            new String[]{filename}, new String[]{content});
    }

    private ResponseEntity<Map> createBundle(Long companyId, String bundleType,
                                               String description, String[] filenames,
                                               String[] contents) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        for (int i = 0; i < filenames.length; i++) {
            body.add("files", createFileResource(filenames[i], contents[i]));
        }
        body.add("bundleType", bundleType);
        body.add("description", description);
        if (companyId != null) {
            body.add("companyId", companyId);
        }
        return restClient.post()
            .uri("/v1/bundles")
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(body)
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toEntity(Map.class);
    }

    private Long createBundleAndGetId(Long companyId, String bundleType,
                                        String description, String filename, String content) {
        ResponseEntity<Map> response = createBundle(companyId, bundleType, description, filename, content);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private Long createBundleAndGetId(Long companyId, String bundleType,
                                        String description, String[] filenames,
                                        String[] contents) {
        ResponseEntity<Map> response = createBundle(companyId, bundleType, description, filenames, contents);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private ByteArrayResource createFileResource(String filename, String content) {
        return new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
    }
}
