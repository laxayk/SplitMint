package com.splitmint;

import com.splitmint.service.Errors;
import com.splitmint.service.SplitService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SplitServiceTest {
    private final SplitService splits = new SplitService();

    @Test
    void equalSplitDistributesLeftoverDeterministically() {
        // 100.00 three ways: 3334, 3333, 3333, leftover to members sorted by user id
        UUID a = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID b = UUID.fromString("00000000-0000-0000-0000-000000000002");
        UUID c = UUID.fromString("00000000-0000-0000-0000-000000000003");
        Map<UUID, Long> r1 = splits.split(SplitService.Mode.EQUAL, 10000, List.of(c, a, b), null, null);
        Map<UUID, Long> r2 = splits.split(SplitService.Mode.EQUAL, 10000, List.of(b, c, a), null, null);
        assertEquals(r1, r2, "same input must give the same split regardless of input order");
        assertEquals(3334, r1.get(a));
        assertEquals(3333, r1.get(b));
        assertEquals(3333, r1.get(c));
        assertEquals(10000, r1.values().stream().mapToLong(Long::longValue).sum());
    }

    @Test
    void exactSplitMustAddUp() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        assertThrows(Errors.BadRequest.class, () ->
                splits.split(SplitService.Mode.EXACT, 10000, List.of(a, b),
                        Map.of(a, 6000L, b, 3000L), null));
        Map<UUID, Long> ok = splits.split(SplitService.Mode.EXACT, 10000, List.of(a, b),
                Map.of(a, 6000L, b, 4000L), null);
        assertEquals(10000, ok.values().stream().mapToLong(Long::longValue).sum());
    }

    @Test
    void percentSplitMustTotal100() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        assertThrows(Errors.BadRequest.class, () ->
                splits.split(SplitService.Mode.PERCENT, 10000, List.of(a, b),
                        null, Map.of(a, 50.0, b, 40.0)));
        Map<UUID, Long> ok = splits.split(SplitService.Mode.PERCENT, 10000, List.of(a, b),
                null, Map.of(a, 33.33, b, 66.67));
        assertEquals(10000, ok.values().stream().mapToLong(Long::longValue).sum());
    }

    @Test
    void rejectsBadInput() {
        UUID a = UUID.randomUUID();
        assertThrows(Errors.BadRequest.class, () ->
                splits.split(SplitService.Mode.EQUAL, 0, List.of(a), null, null));
        assertThrows(Errors.BadRequest.class, () ->
                splits.split(SplitService.Mode.EQUAL, 1000, List.of(), null, null));
    }
}
