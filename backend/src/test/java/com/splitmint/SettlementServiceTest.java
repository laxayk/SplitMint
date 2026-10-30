package com.splitmint;

import com.splitmint.service.SettlementService;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SettlementServiceTest {
    private final SettlementService settlements = new SettlementService();

    @Test
    void applyingSuggestionsLeavesEveryoneAtZero() {
        Map<UUID, Long> net = new HashMap<>();
        UUID a = UUID.randomUUID(), b = UUID.randomUUID(), c = UUID.randomUUID(), d = UUID.randomUUID();
        net.put(a, 5000L);
        net.put(b, -3000L);
        net.put(c, 1500L);
        net.put(d, -3500L);
        var transfers = settlements.suggest(net);
        for (var t : transfers) {
            net.merge(t.fromUser(), t.amountMinor(), Long::sum);
            net.merge(t.toUser(), -t.amountMinor(), Long::sum);
        }
        assertTrue(net.values().stream().allMatch(v -> v == 0), "all balances settled to zero");
    }

    @Test
    void handlesEmptyAndBalancedGroups() {
        assertTrue(settlements.suggest(Map.of()).isEmpty());
        UUID a = UUID.randomUUID(), b = UUID.randomUUID();
        assertTrue(settlements.suggest(Map.of(a, 0L, b, 0L)).isEmpty());
    }
}
