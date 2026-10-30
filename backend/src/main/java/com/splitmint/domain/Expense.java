package com.splitmint.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "expense")
public class Expense {
    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID groupId;
    @Column(nullable = false, length = 200)
    private String title;
    /** Money is always integer minor units (paise/cents). Never floating point. */
    @Column(nullable = false)
    private long amountMinor;
    @Column(nullable = false)
    private LocalDate expenseDate;
    @Column(nullable = false)
    private UUID paidBy;
    @Column(nullable = false)
    private UUID createdBy;
    /** Client-generated idempotency key: one logical save, one row. */
    @Column(nullable = false, length = 80)
    private String requestId;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected Expense() {}

    public Expense(UUID groupId, String title, long amountMinor, LocalDate expenseDate,
                   UUID paidBy, UUID createdBy, String requestId) {
        this.id = UUID.randomUUID();
        this.groupId = groupId;
        this.title = title;
        this.amountMinor = amountMinor;
        this.expenseDate = expenseDate;
        this.paidBy = paidBy;
        this.createdBy = createdBy;
        this.requestId = requestId;
    }

    public UUID getId() { return id; }
    public UUID getGroupId() { return groupId; }
    public String getTitle() { return title; }
    public long getAmountMinor() { return amountMinor; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public UUID getPaidBy() { return paidBy; }
    public UUID getCreatedBy() { return createdBy; }
    public String getRequestId() { return requestId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String title, long amountMinor, LocalDate expenseDate, UUID paidBy) {
        this.title = title;
        this.amountMinor = amountMinor;
        this.expenseDate = expenseDate;
        this.paidBy = paidBy;
        this.updatedAt = Instant.now();
    }
}
