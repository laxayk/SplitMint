package com.splitmint.service;

import com.splitmint.domain.Payment;
import com.splitmint.repo.*;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Net balance per member of one group, in integer minor units.
 * Positive: the group owes this person. Negative: this person owes the group.
 * Only CONFIRMED payments move balances. Balances for a group always sum to zero.
 */
@Service
public class BalanceService {
    private final ExpenseRepo expenses;
    private final ShareRepo shares;
    private final PaymentRepo payments;

    public BalanceService(ExpenseRepo expenses, ShareRepo shares, PaymentRepo payments) {
        this.expenses = expenses;
        this.shares = shares;
        this.payments = payments;
    }

    public Map<UUID, Long> netBalances(UUID groupId) {
        Map<UUID, Long> net = new HashMap<>();
        for (var e : expenses.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            net.merge(e.getPaidBy(), e.getAmountMinor(), Long::sum);
        }
        for (var s : shares.findAllForGroup(groupId)) {
            net.merge(s.getUserId(), -s.getShareMinor(), Long::sum);
        }
        for (var p : payments.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            if (p.getStatus() == Payment.Status.CONFIRMED) {
                net.merge(p.getFromUser(), p.getAmountMinor(), Long::sum);
                net.merge(p.getToUser(), -p.getAmountMinor(), Long::sum);
            }
        }
        return net;
    }
}
