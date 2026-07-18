package com.example.decisioning.config;

import com.example.decisioning.entity.BundleType;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "bundle")
public class BundleTypeConfig {

    private Map<BundleType, String> types = new EnumMap<>(BundleType.class);

    public Map<BundleType, String> getTypes() {
        return types;
    }

    public void setTypes(Map<BundleType, String> types) {
        this.types = types;
    }
}
