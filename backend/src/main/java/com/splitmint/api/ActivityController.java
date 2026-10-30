package com.splitmint.api;

import com.splitmint.repo.ExpenseRepo;
import com.splitmint.repo.PaymentRepo;
import com.splitmint.service.GroupService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ActivityController {
    private final GroupService groupService;
    private final ExpenseRepo expenses;
    private final PaymentRepo payments;

    public ActivityController(GroupService groupService, ExpenseRepo expenses, PaymentRepo payments) {
        this.groupService = groupService;
        this.expenses = expenses;
        this.payments = payments;
    }

    @GetMapping("/api/groups/{groupId}/activity")
    public List<Dto.ActivityItem> feed(@PathVariable UUID groupId) {
        UUID me = CurrentUser.id();
        var group = groupService.requireMembership(groupId, me);
        String currency = group.getCurrency();
        List<Dto.ActivityItem> items = new ArrayList<>();
        for (var e : expenses.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            items.add(new Dto.ActivityItem("expense", e.getId(),
                    e.getTitle() + " · " + money(e.getAmountMinor(), currency), e.getCreatedAt().toString()));
        }
        for (var p : payments.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            String status = p.getStatus().name().charAt(0) + p.getStatus().name().substring(1).toLowerCase(Locale.ROOT);
            items.add(new Dto.ActivityItem("payment", p.getId(),
                    "Payment of " + money(p.getAmountMinor(), currency) + " (" + status + ")", p.getCreatedAt().toString()));
        }
        items.sort(Comparator.comparing(Dto.ActivityItem::at).reversed());
        return items;
    }

    private static String money(long minor, String currency) {
        return currency + " " + String.format(Locale.ROOT, "%,.2f", minor / 100.0);
    }
}
