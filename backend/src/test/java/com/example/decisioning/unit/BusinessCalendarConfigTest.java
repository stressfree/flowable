package com.example.decisioning.unit;

import com.example.decisioning.config.BusinessCalendarConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class BusinessCalendarConfigTest {

    private BusinessCalendarConfig.WorkingDayBusinessCalendar calendar;

    @BeforeEach
    void setUp() {
        calendar = new BusinessCalendarConfig.WorkingDayBusinessCalendar();
    }

    @Test
    void resolveDuedateWithNullReturnsNowish() {
        Date result = calendar.resolveDuedate(null);
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithBlankReturnsNowish() {
        Date result = calendar.resolveDuedate("   ");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithDaysDuration() {
        Date result = calendar.resolveDuedate("P1D");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithHoursDuration() {
        Date result = calendar.resolveDuedate("PT2H");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithMinutesDuration() {
        Date result = calendar.resolveDuedate("PT30M");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithSecondsDuration() {
        Date result = calendar.resolveDuedate("PT45S");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithCombinedDuration() {
        Date result = calendar.resolveDuedate("P1DT2H30M");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithTimerIndex() {
        Date result = calendar.resolveDuedate("PT1H", 0);
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithDurationSpanningWeekend() {
        Date result = calendar.resolveDuedate("P5D");
        assertThat(result).isNotNull();
    }

    @Test
    void resolveDuedateWithUnknownUnitIgnoresIt() {
        Date result = calendar.resolveDuedate("P1X");
        assertThat(result).isNotNull();
    }

    @Test
    void validateDuedateWithNullReturnsTrue() {
        Boolean result = calendar.validateDuedate("PT1H", 1, null, new Date());
        assertThat(result).isTrue();
    }

    @Test
    void validateDuedateAfterEndDateReturnsTrue() {
        Date duedate = new Date(System.currentTimeMillis() + 10000);
        Date endDate = new Date(System.currentTimeMillis());
        Boolean result = calendar.validateDuedate("PT1H", 1, duedate, endDate);
        assertThat(result).isTrue();
    }

    @Test
    void validateDuedateBeforeEndDateReturnsFalse() {
        Date endDate = new Date(System.currentTimeMillis() + 10000);
        Date duedate = new Date(System.currentTimeMillis());
        Boolean result = calendar.validateDuedate("PT1H", 1, duedate, endDate);
        assertThat(result).isFalse();
    }

    @Test
    void validateDuedateEqualsEndDateReturnsTrue() {
        Date date = new Date();
        Boolean result = calendar.validateDuedate("PT1H", 1, date, date);
        assertThat(result).isTrue();
    }

    @Test
    void resolveEndDateReturnsNull() {
        Date result = calendar.resolveEndDate("PT1H");
        assertThat(result).isNull();
    }
}
