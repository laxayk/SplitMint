package com.splitmint.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "expense_group")
public class ExpenseGroup {
    @Id
    private UUID id;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 3)
    private String currency;
    @Column(nullable = false)
    private UUID createdBy;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected ExpenseGroup() {}

    public ExpenseGroup(String name, String currency, UUID createdBy) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.currency = currency.toUpperCase();
        this.createdBy = createdBy;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getCurrency() { return currency; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
