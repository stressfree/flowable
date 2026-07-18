package com.example.decisioning.config;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.flowable.common.engine.impl.calendar.BusinessCalendar;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BusinessCalendarConfig {

    private static final Pattern DURATION_PATTERN = Pattern.compile("(\\d+)([A-Z])");

    @Bean
    public BusinessCalendar workingDayBusinessCalendar() {
        return new WorkingDayBusinessCalendar();
    }

    public static class WorkingDayBusinessCalendar implements BusinessCalendar {

        @Override
        public Date resolveDuedate(String duedateDescription) {
            return resolveDuedate(duedateDescription, -1);
        }

        @Override
        public Date resolveDuedate(String duedateDescription, int timerIndex) {
            long millis = parseDurationMillis(duedateDescription);
            LocalDateTime base = LocalDateTime.now();
            LocalDateTime result = addWorkingMillis(base, millis);
            return Date.from(result.atZone(ZoneId.systemDefault()).toInstant());
        }

        @Override
        public Boolean validateDuedate(
                String duedateDescription, int maxIterations, Date duedate, Date endDate) {
            if (duedate == null) {
                return Boolean.TRUE;
            }
            return duedate.after(endDate) || duedate.equals(endDate);
        }

        @Override
        public Date resolveEndDate(String duedateDescription) {
            return null;
        }

        private long parseDurationMillis(String description) {
            if (description == null || description.isBlank()) {
                return 0L;
            }
            String trimmed = description.trim().replace("P", "").replace("T", "");
            long totalMillis = 0L;
            Matcher matcher = DURATION_PATTERN.matcher(trimmed);
            while (matcher.find()) {
                long value = Long.parseLong(matcher.group(1));
                String unit = matcher.group(2);
                switch (unit) {
                    case "D" -> totalMillis += value * 24L * 60 * 60 * 1000;
                    case "H" -> totalMillis += value * 60 * 60 * 1000;
                    case "M" -> totalMillis += value * 60 * 1000;
                    case "S" -> totalMillis += value * 1000;
                    default -> { }
                }
            }
            return totalMillis;
        }

        private LocalDateTime addWorkingMillis(LocalDateTime start, long millisToAdd) {
            LocalDateTime current = start;
            long remaining = millisToAdd;
            while (remaining > 0) {
                DayOfWeek day = current.getDayOfWeek();
                if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                    LocalDateTime endOfDay = current.toLocalDate().atTime(23, 59, 59);
                    long availableInMillis = Duration.between(current, endOfDay).toMillis();
                    if (remaining > availableInMillis) {
                        current = endOfDay;
                        remaining -= availableInMillis;
                    } else {
                        current = current.plus(remaining, ChronoUnit.MILLIS);
                        remaining = 0;
                    }
                }
                if (remaining > 0) {
                    current = current.toLocalDate().plusDays(1).atStartOfDay();
                }
            }
            DayOfWeek resultDay = current.getDayOfWeek();
            while (resultDay == DayOfWeek.SATURDAY || resultDay == DayOfWeek.SUNDAY) {
                current = current.toLocalDate().plusDays(1).atStartOfDay();
                resultDay = current.getDayOfWeek();
            }
            return current;
        }
    }
}
