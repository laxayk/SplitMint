package com.splitmint.service;

import com.splitmint.api.Dto;
import com.splitmint.domain.*;
import com.splitmint.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class GroupService {
    private final UserRepo users;
    private final GroupRepo groups;
    private final MemberRepo members;
    private final ExpenseRepo expenses;
    private final ShareRepo shares;
    private final PaymentRepo payments;
    private final BalanceService balanceService;

    public GroupService(UserRepo users, GroupRepo groups, MemberRepo members,
                        ExpenseRepo expenses, ShareRepo shares, PaymentRepo payments,
                        BalanceService balanceService) {
        this.users = users;
        this.groups = groups;
        this.members = members;
        this.expenses = expenses;
        this.shares = shares;
        this.payments = payments;
        this.balanceService = balanceService;
    }

    public ExpenseGroup requireMembership(UUID groupId, UUID userId) {
        ExpenseGroup g = groups.findById(groupId)
                .orElseThrow(() -> new Errors.NotFound("Group not found"));
        if (!members.existsByGroupIdAndUserId(groupId, userId)) {
            // Same refusal whether the group is missing or not theirs: no existence leak.
            throw new Errors.Forbidden("You do not have access to this group");
        }
        return g;
    }

    @Transactional
    public ExpenseGroup createGroup(String name, String currency, UUID creatorId) {
        ExpenseGroup g = groups.save(new ExpenseGroup(name, currency, creatorId));
        members.save(new GroupMember(g.getId(), creatorId));
        return g;
    }

    @Transactional
    public void addMember(UUID groupId, UUID actorId, String email) {
        requireMembership(groupId, actorId);
        AppUser user = users.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new Errors.NotFound("No registered account for " + email));
        if (members.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new Errors.Conflict(user.getEmail() + " is already in this group");
        }
        members.save(new GroupMember(groupId, user.getId()));
    }

    @Transactional
    public void leaveGroup(UUID groupId, UUID userId) {
        requireMembership(groupId, userId);
        long net = balanceService.netBalances(groupId).getOrDefault(userId, 0L);
        if (net != 0) {
            throw new Errors.Conflict("Settle your balance before leaving this group");
        }
        var list = members.findByGroupId(groupId);
        if (list.size() <= 1) {
            throw new Errors.Conflict("The last member cannot leave; delete the group instead");
        }
        members.deleteById(new GroupMember.Pk(groupId, userId));
    }

    public List<Dto.MemberView> memberViews(UUID groupId) {
        List<Dto.MemberView> out = new ArrayList<>();
        for (GroupMember m : members.findByGroupId(groupId)) {
            users.findById(m.getUserId()).ifPresent(u ->
                    out.add(new Dto.MemberView(u.getId(), u.getEmail(), u.getDisplayName())));
        }
        out.sort(Comparator.comparing(Dto.MemberView::displayName));
        return out;
    }

    @Transactional
    public Expense createExpense(UUID groupId, UUID actorId, Dto.ExpenseRequest req, Map<UUID, Long> split) {
        // Idempotency: a retried request id returns the already-saved expense.
        var existing = expenses.findByCreatedByAndRequestId(actorId, req.requestId());
        if (existing.isPresent()) return existing.get();

        if (!members.existsByGroupIdAndUserId(groupId, req.paidBy())) {
            throw new Errors.BadRequest("The person who paid must be a member of this group");
        }
        for (UUID u : req.sharedBy()) {
            if (!members.existsByGroupIdAndUserId(groupId, u)) {
                throw new Errors.BadRequest("Everyone sharing an expense must be a member of this group");
            }
        }
        Expense saved = expenses.save(new Expense(groupId, req.title(), req.amountMinor(),
                req.date(), req.paidBy(), actorId, req.requestId()));
        for (var e : split.entrySet()) {
            shares.save(new ExpenseShare(saved.getId(), e.getKey(), e.getValue()));
        }
        return saved;
    }

    private void requireUnlocked(UUID groupId) {
        if (payments.existsByGroupId(groupId)) {
            throw new Errors.Conflict(
                    "Expenses are locked because a payment has been recorded in this group. Add a reversing expense to correct it.");
        }
    }

    @Transactional
    public Expense updateExpense(UUID expenseId, UUID actorId, Dto.ExpenseRequest req, Map<UUID, Long> split) {
        Expense e = expenses.findById(expenseId)
                .orElseThrow(() -> new Errors.NotFound("Expense not found"));
        requireMembership(e.getGroupId(), actorId);
        if (!e.getCreatedBy().equals(actorId)) {
            throw new Errors.Forbidden("Only the person who created an expense can edit it");
        }
        requireUnlocked(e.getGroupId());
        e.update(req.title(), req.amountMinor(), req.date(), req.paidBy());
        for (var s : shares.findByExpenseId(expenseId)) shares.delete(s);
        for (var en : split.entrySet()) {
            shares.save(new ExpenseShare(expenseId, en.getKey(), en.getValue()));
        }
        return e;
    }

    @Transactional
    public void deleteExpense(UUID expenseId, UUID actorId) {
        Expense e = expenses.findById(expenseId)
                .orElseThrow(() -> new Errors.NotFound("Expense not found"));
        requireMembership(e.getGroupId(), actorId);
        if (!e.getCreatedBy().equals(actorId)) {
            throw new Errors.Forbidden("Only the person who created an expense can delete it");
        }
        requireUnlocked(e.getGroupId());
        expenses.delete(e);
    }

    @Transactional
    public Payment recordPayment(UUID groupId, UUID actorId, Dto.PaymentRequest req) {
        requireMembership(groupId, actorId);
        if (!actorId.equals(req.fromUser()) && !actorId.equals(req.toUser())) {
            throw new Errors.Forbidden("Only the payer or the receiver can record a payment");
        }
        if (req.fromUser().equals(req.toUser())) {
            throw new Errors.BadRequest("A payment needs two different people");
        }
        if (!members.existsByGroupIdAndUserId(groupId, req.fromUser())
                || !members.existsByGroupIdAndUserId(groupId, req.toUser())) {
            throw new Errors.BadRequest("Both sides of a payment must be in this group");
        }
        var existing = payments.findByRecordedByAndRequestId(actorId, req.requestId());
        if (existing.isPresent()) return existing.get();
        return payments.save(new Payment(groupId, req.fromUser(), req.toUser(),
                req.amountMinor(), actorId, req.requestId()));
    }

    @Transactional
    public Payment confirmPayment(UUID paymentId, UUID actorId) {
        Payment p = payments.findById(paymentId)
                .orElseThrow(() -> new Errors.NotFound("Payment not found"));
        requireMembership(p.getGroupId(), actorId);
        if (p.getStatus() == Payment.Status.CONFIRMED) return p;
        // The side that did not record it confirms it.
        if (p.getRecordedBy().equals(actorId)) {
            throw new Errors.Forbidden("The other person in the payment must confirm it");
        }
        if (!actorId.equals(p.getFromUser()) && !actorId.equals(p.getToUser())) {
            throw new Errors.Forbidden("Only the two people in the payment can confirm it");
        }
        p.confirm(actorId);
        return p;
    }

    @Transactional
    public void cancelPayment(UUID paymentId, UUID actorId) {
        Payment p = payments.findById(paymentId)
                .orElseThrow(() -> new Errors.NotFound("Payment not found"));
        requireMembership(p.getGroupId(), actorId);
        if (p.getStatus() == Payment.Status.CONFIRMED) {
            throw new Errors.Conflict("A confirmed payment cannot be cancelled; record a reversing payment instead");
        }
        if (!p.getRecordedBy().equals(actorId)) {
            throw new Errors.Forbidden("Only the person who recorded a payment can cancel it");
        }
        payments.delete(p);
    }
}
