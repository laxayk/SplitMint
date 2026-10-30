package com.splitmint.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "expense_share")
@IdClass(ExpenseShare.Pk.class)
public class ExpenseShare {

    public static class Pk implements Serializable {
        private UUID expenseId;
        private UUID userId;
        public Pk() {}
        public Pk(UUID expenseId, UUID userId) { this.expenseId = expenseId; this.userId = userId; }
    }

    @Id
    private UUID expenseId;
    @Id
    private UUID userId;
    @Column(nullable = false)
    private long shareMinor;

    protected ExpenseShare() {}

    public ExpenseShare(UUID expenseId, UUID userId, long shareMinor) {
        this.expenseId = expenseId;
        this.userId = userId;
        this.shareMinor = shareMinor;
    }

    public UUID getExpenseId() { return expenseId; }
    public UUID getUserId() { return userId; }
    public long getShareMinor() { return shareMinor; }
    public void setShareMinor(long shareMinor) { this.shareMinor = shareMinor; }
}
