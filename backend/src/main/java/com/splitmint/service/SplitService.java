package com.splitmint.service;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Computes per-person shares for one expense.
 *
 * Money is integer minor units. Rounding leftovers are assigned one unit at a
 * time to members sorted by user id, so the same input always produces the
 * same split and the shares always add up to the total exactly.
 * Example: 100.00 split equally three ways is 33.34, 33.33, 33.33.
 */
@Service
public class SplitService {

    public enum Mode { EQUAL, EXACT, PERCENT }

    /** Returns user id -> share in minor units. Sum of shares equals amountMinor. */
    public Map<UUID, Long> split(Mode mode, long amountMinor, List<UUID> memberIds,
                                 Map<UUID, Long> exact, Map<UUID, Double> percent) {
        if (amountMinor <= 0) throw new Errors.BadRequest("Amount must be positive");
        if (memberIds.isEmpty()) throw new Errors.BadRequest("An expense needs at least one person sharing it");
        List<UUID> ordered = memberIds.stream().sorted().toList();
        long[] shares = new long[ordered.size()];

        switch (mode) {
            case EQUAL -> {
                long base = amountMinor / ordered.size();
                long remainder = amountMinor % ordered.size();
                for (int i = 0; i < ordered.size(); i++) {
                    shares[i] = base + (i < remainder ? 1 : 0);
                }
            }
            case EXACT -> {
                if (exact == null || exact.size() != ordered.size() || !exact.keySet().containsAll(ordered)) {
                    throw new Errors.BadRequest("Exact split needs an amount for every person");
                }
                long sum = 0;
                for (int i = 0; i < ordered.size(); i++) {
                    Long v = exact.get(ordered.get(i));
                    if (v == null || v < 0) throw new Errors.BadRequest("Exact shares cannot be negative");
                    shares[i] = v;
                    sum += v;
                }
                if (sum != amountMinor) {
                    throw new Errors.BadRequest("Exact shares add up to " + sum + " but the expense is " + amountMinor);
                }
            }
            case PERCENT -> {
                if (percent == null || percent.size() != ordered.size() || !percent.keySet().containsAll(ordered)) {
                    throw new Errors.BadRequest("Percentage split needs a percentage for every person");
                }
                double totalPct = 0;
                for (UUID id : ordered) {
                    Double p = percent.get(id);
                    if (p == null || p < 0) throw new Errors.BadRequest("Percentages cannot be negative");
                    totalPct += p;
                }
                if (Math.abs(totalPct - 100.0) > 0.0001) {
                    throw new Errors.BadRequest("Percentages add up to " + totalPct + " but must add up to 100");
                }
                // Floor each share, then hand out the leftover units by fixed member order.
                long assigned = 0;
                int[] orderByLargestFraction = new int[ordered.size()];
                double[] fractions = new double[ordered.size()];
                for (int i = 0; i < ordered.size(); i++) {
                    double raw = amountMinor * percent.get(ordered.get(i)) / 100.0;
                    shares[i] = (long) Math.floor(raw);
                    fractions[i] = raw - shares[i];
                    assigned += shares[i];
                }
                long leftover = amountMinor - assigned;
                // Deterministic: fixed order by user id, not by fraction size.
                for (int i = 0; leftover > 0; i = (i + 1) % ordered.size()) {
                    shares[i]++;
                    leftover--;
                }
            }
        }

        Map<UUID, Long> result = new LinkedHashMap<>();
        for (int i = 0; i < ordered.size(); i++) result.put(ordered.get(i), shares[i]);
        return result;
    }
}
