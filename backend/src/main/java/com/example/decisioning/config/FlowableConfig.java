package com.example.decisioning.config;

import org.flowable.common.engine.impl.AbstractEngineConfiguration;
import org.flowable.common.engine.impl.EngineConfigurator;
import org.flowable.common.engine.impl.calendar.BusinessCalendar;
import org.flowable.common.engine.impl.calendar.MapBusinessCalendarManager;
import org.flowable.spring.SpringProcessEngineConfiguration;
import org.flowable.spring.boot.EngineConfigurationConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

@Configuration
public class FlowableConfig {

    @Bean
    public EngineConfigurationConfigurer<SpringProcessEngineConfiguration>
            engineConfigurationConfigurer(BusinessCalendar workingDayBusinessCalendar) {
        return configuration -> {
            configuration.setDatabaseSchema("flowable");
            configuration.setDatabaseSchemaUpdate("true");
            configuration.setAsyncExecutorActivate(false);
            configuration.addConfigurator(
                    new WorkingDayCalendarConfigurator(workingDayBusinessCalendar));
        };
    }

    @Order(Ordered.LOWEST_PRECEDENCE)
    private static final class WorkingDayCalendarConfigurator implements EngineConfigurator {

        private final BusinessCalendar workingDayBusinessCalendar;

        WorkingDayCalendarConfigurator(BusinessCalendar workingDayBusinessCalendar) {
            this.workingDayBusinessCalendar = workingDayBusinessCalendar;
        }

        @Override
        public void beforeInit(AbstractEngineConfiguration engineConfiguration) {
        }

        @Override
        public void configure(AbstractEngineConfiguration engineConfiguration) {
            if (engineConfiguration instanceof SpringProcessEngineConfiguration springConfig) {
                if (springConfig.getBusinessCalendarManager()
                        instanceof MapBusinessCalendarManager mapManager) {
                    mapManager.addBusinessCalendar("workingDay", workingDayBusinessCalendar);
                }
            }
        }

        @Override
        public int getPriority() {
            return Ordered.LOWEST_PRECEDENCE;
        }
    }
}
