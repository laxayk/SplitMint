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
        groupService.requireMembership(groupId, me);
        List<Dto.ActivityItem> items = new ArrayList<>();
        for (var e : expenses.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            items.add(new Dto.ActivityItem("expense", e.getId(),
                    e.getTitle() + " · " + e.getAmountMinor() + " minor units", e.getCreatedAt().toString()));
        }
        for (var p : payments.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            items.add(new Dto.ActivityItem("payment", p.getId(),
                    "Payment " + p.getAmountMinor() + " (" + p.getStatus() + ")", p.getCreatedAt().toString()));
        }
        items.sort(Comparator.comparing(Dto.ActivityItem::at).reversed());
        return items;
    }
}
