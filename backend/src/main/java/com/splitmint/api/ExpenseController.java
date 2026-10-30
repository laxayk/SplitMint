package com.splitmint.api;

import com.splitmint.domain.Expense;
import com.splitmint.repo.ExpenseRepo;
import com.splitmint.repo.ShareRepo;
import com.splitmint.service.GroupService;
import com.splitmint.service.SplitService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ExpenseController {
    private final GroupService groupService;
    private final SplitService splitService;
    private final ExpenseRepo expenses;
    private final ShareRepo shares;

    public ExpenseController(GroupService groupService, SplitService splitService,
                             ExpenseRepo expenses, ShareRepo shares) {
        this.groupService = groupService;
        this.splitService = splitService;
        this.expenses = expenses;
        this.shares = shares;
    }

    private Map<UUID, Long> computeSplit(Dto.ExpenseRequest req) {
        return splitService.split(SplitService.Mode.valueOf(req.splitMode()),
                req.amountMinor(), req.sharedBy(), req.exactShares(), req.percentShares());
    }

    private Dto.ExpenseResponse view(Expense e) {
        var shareViews = shares.findByExpenseId(e.getId()).stream()
                .map(s -> new Dto.ShareView(s.getUserId(), s.getShareMinor()))
                .sorted(Comparator.comparing(Dto.ShareView::userId))
                .toList();
        return new Dto.ExpenseResponse(e.getId(), e.getGroupId(), e.getTitle(), e.getAmountMinor(),
                e.getExpenseDate(), e.getPaidBy(), e.getCreatedBy(), e.getRequestId(), shareViews);
    }

    @PostMapping("/api/groups/{groupId}/expenses")
    public Dto.ExpenseResponse create(@PathVariable UUID groupId,
                                      @Valid @RequestBody Dto.ExpenseRequest req) {
        UUID me = CurrentUser.id();
        groupService.requireMembership(groupId, me);
        return view(groupService.createExpense(groupId, me, req, computeSplit(req)));
    }

    @GetMapping("/api/groups/{groupId}/expenses")
    public List<Dto.ExpenseResponse> list(@PathVariable UUID groupId) {
        UUID me = CurrentUser.id();
        groupService.requireMembership(groupId, me);
        return expenses.findByGroupIdOrderByCreatedAtDesc(groupId).stream().map(this::view).toList();
    }

    @PutMapping("/api/expenses/{expenseId}")
    public Dto.ExpenseResponse update(@PathVariable UUID expenseId,
                                      @Valid @RequestBody Dto.ExpenseRequest req) {
        return view(groupService.updateExpense(expenseId, CurrentUser.id(), req, computeSplit(req)));
    }

    @DeleteMapping("/api/expenses/{expenseId}")
    public Map<String, String> delete(@PathVariable UUID expenseId) {
        groupService.deleteExpense(expenseId, CurrentUser.id());
        return Map.of("status", "deleted");
    }
}
