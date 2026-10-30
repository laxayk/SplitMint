package com.splitmint.service;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Suggests who should pay whom from net balances.
 *
 * Greedy heuristic: the largest debtor pays the largest creditor until everyone
 * is at zero. This settles every balance, but it does NOT guarantee the fewest
 * possible transfers. That claim is deliberately out of scope.
 */
@Service
public class SettlementService {

    public record Transfer(UUID fromUser, UUID toUser, long amountMinor) {}

    public List<Transfer> suggest(Map<UUID, Long> netBalances) {
        PriorityQueue<Map.Entry<UUID, Long>> debtors = new PriorityQueue<>(
                Map.Entry.<UUID, Long>comparingByValue().thenComparing(e -> e.getKey().toString()));
        PriorityQueue<Map.Entry<UUID, Long>> creditors = new PriorityQueue<>(
                Map.Entry.<UUID, Long>comparingByValue(Comparator.reverseOrder()).thenComparing(e -> e.getKey().toString()));

        for (var e : netBalances.entrySet()) {
            if (e.getValue() < 0) debtors.add(Map.entry(e.getKey(), e.getValue()));
            else if (e.getValue() > 0) creditors.add(Map.entry(e.getKey(), e.getValue()));
        }

        List<Transfer> result = new ArrayList<>();
        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            var d = debtors.poll();
            var c = creditors.poll();
            long pay = Math.min(-d.getValue(), c.getValue());
            result.add(new Transfer(d.getKey(), c.getKey(), pay));
            long dLeft = d.getValue() + pay;
            long cLeft = c.getValue() - pay;
            if (dLeft < 0) debtors.add(Map.entry(d.getKey(), dLeft));
            if (cLeft > 0) creditors.add(Map.entry(c.getKey(), cLeft));
        }
        return result;
    }
}
