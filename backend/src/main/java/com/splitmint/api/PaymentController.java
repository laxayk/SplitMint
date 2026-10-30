package com.splitmint.api;

import com.splitmint.domain.Payment;
import com.splitmint.repo.PaymentRepo;
import com.splitmint.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class PaymentController {
    private final GroupService groupService;
    private final PaymentRepo payments;

    public PaymentController(GroupService groupService, PaymentRepo payments) {
        this.groupService = groupService;
        this.payments = payments;
    }

    private Dto.PaymentResponse view(Payment p) {
        return new Dto.PaymentResponse(p.getId(), p.getGroupId(), p.getFromUser(), p.getToUser(),
                p.getAmountMinor(), p.getStatus().name(), p.getRecordedBy(), p.getConfirmedBy(), p.getRequestId());
    }

    @PostMapping("/api/groups/{groupId}/payments")
    public Dto.PaymentResponse record(@PathVariable UUID groupId,
                                      @Valid @RequestBody Dto.PaymentRequest req) {
        return view(groupService.recordPayment(groupId, CurrentUser.id(), req));
    }

    @GetMapping("/api/groups/{groupId}/payments")
    public List<Dto.PaymentResponse> list(@PathVariable UUID groupId) {
        UUID me = CurrentUser.id();
        groupService.requireMembership(groupId, me);
        return payments.findByGroupIdOrderByCreatedAtDesc(groupId).stream().map(this::view).toList();
    }

    @PostMapping("/api/payments/{paymentId}/confirm")
    public Dto.PaymentResponse confirm(@PathVariable UUID paymentId) {
        return view(groupService.confirmPayment(paymentId, CurrentUser.id()));
    }

    @DeleteMapping("/api/payments/{paymentId}")
    public Map<String, String> cancel(@PathVariable UUID paymentId) {
        groupService.cancelPayment(paymentId, CurrentUser.id());
        return Map.of("status", "cancelled");
    }
}
