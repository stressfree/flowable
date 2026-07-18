package com.example.decisioning.integration;

import com.example.decisioning.dto.CompanyRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
class CompanyIntegrationTest {

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

    @BeforeEach
    void setUp() {
        restClient = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .build();
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
    void createCompanyReturns201() throws Exception {
        CompanyRequest request = new CompanyRequest("Acme Corp", null);

        ResponseEntity<Map> response = restClient.post()
            .uri("/v1/companies")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(request))
            .retrieve()
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("name")).isEqualTo("Acme Corp");
        assertThat(response.getBody().get("id")).isNotNull();
    }

    @Test
    void createCompanyWithParentReturns201() throws Exception {
        Long parentId = createCompany("Parent Corp");

        CompanyRequest childRequest = new CompanyRequest("Child Corp", parentId);

        ResponseEntity<Map> childResponse = restClient.post()
            .uri("/v1/companies")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(childRequest))
            .retrieve()
            .toEntity(Map.class);

        assertThat(childResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(childResponse.getBody().get("parentCompanyId")).isEqualTo(parentId.intValue());
        assertThat(childResponse.getBody().get("parentCompanyName")).isEqualTo("Parent Corp");
    }

    @Test
    void createCompanyWithNonExistentParentReturns404() throws Exception {
        CompanyRequest request = new CompanyRequest("Orphan Corp", 9999L);

        ResponseEntity<Map> response = restClient.post()
            .uri("/v1/companies")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(request))
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("detail").toString()).contains("9999");
    }

    @Test
    void createCompanyWithBlankNameReturns400() throws Exception {
        CompanyRequest request = new CompanyRequest("", null);

        ResponseEntity<Map> response = restClient.post()
            .uri("/v1/companies")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(request))
            .retrieve()
            .onStatus(s -> s.value() == 400, (req, res) -> {})
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("title")).isEqualTo("Validation failed");
    }

    @Test
    void findAllCompaniesReturns200() throws Exception {
        createCompany("Alpha Corp");
        createCompany("Beta Corp");

        ResponseEntity<List> response = restClient.get()
            .uri("/v1/companies")
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void findAllCompaniesOrderedByName() throws Exception {
        createCompany("Zebra Inc");
        createCompany("Apple Corp");

        ResponseEntity<List> response = restClient.get()
            .uri("/v1/companies")
            .retrieve()
            .toEntity(List.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> body = response.getBody();
        assertThat(body).hasSizeGreaterThanOrEqualTo(2);
        Map<?, ?> first = (Map<?, ?>) body.get(0);
        assertThat(first.get("name")).isEqualTo("Apple Corp");
    }

    @Test
    void findCompanyByIdReturns200WithDetail() throws Exception {
        Long parentId = createCompany("Parent Corp");
        Long childId = createCompanyWithParent("Child Corp", parentId);

        ResponseEntity<Map> response = restClient.get()
            .uri("/v1/companies/" + childId)
            .retrieve()
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("name")).isEqualTo("Child Corp");
        assertThat(response.getBody().get("parentCompanyName")).isEqualTo("Parent Corp");
        assertThat(response.getBody().get("children")).isNotNull();
        assertThat(response.getBody().get("bundles")).isNotNull();
    }

    @Test
    void findCompanyByIdNotFoundReturns404() {
        ResponseEntity<Map> response = restClient.get()
            .uri("/v1/companies/9999")
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toEntity(Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("detail").toString()).contains("9999");
    }

    @Test
    void deleteCompanyReturns204() throws Exception {
        Long companyId = createCompany("Temp Corp");

        restClient.delete()
            .uri("/v1/companies/" + companyId)
            .retrieve()
            .toBodilessEntity();

        ResponseEntity<Map> checkResponse = restClient.get()
            .uri("/v1/companies/" + companyId)
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toEntity(Map.class);
        assertThat(checkResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void deleteCompanyNotFoundReturns404() {
        ResponseEntity<Void> response = restClient.delete()
            .uri("/v1/companies/9999")
            .retrieve()
            .onStatus(s -> s.value() == 404, (req, res) -> {})
            .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private Long createCompany(String name) throws Exception {
        CompanyRequest request = new CompanyRequest(name, null);
        ResponseEntity<Map> response = restClient.post()
            .uri("/v1/companies")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(request))
            .retrieve()
            .toEntity(Map.class);
        return ((Number) response.getBody().get("id")).longValue();
    }

    private Long createCompanyWithParent(String name, Long parentId) throws Exception {
        CompanyRequest request = new CompanyRequest(name, parentId);
        ResponseEntity<Map> response = restClient.post()
            .uri("/v1/companies")
            .contentType(MediaType.APPLICATION_JSON)
            .body(objectMapper.writeValueAsString(request))
            .retrieve()
            .toEntity(Map.class);
        return ((Number) response.getBody().get("id")).longValue();
    }
}
