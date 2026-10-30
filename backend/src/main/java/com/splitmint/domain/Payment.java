package com.splitmint.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment")
public class Payment {
    public enum Status { PENDING, CONFIRMED }

    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID groupId;
    @Column(nullable = false)
    private UUID fromUser;
    @Column(nullable = false)
    private UUID toUser;
    @Column(nullable = false)
    private long amountMinor;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Status status = Status.PENDING;
    @Column(nullable = false)
    private UUID recordedBy;
    private UUID confirmedBy;
    @Column(nullable = false, length = 80)
    private String requestId;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private Instant confirmedAt;

    protected Payment() {}

    public Payment(UUID groupId, UUID fromUser, UUID toUser, long amountMinor, UUID recordedBy, String requestId) {
        this.id = UUID.randomUUID();
        this.groupId = groupId;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.amountMinor = amountMinor;
        this.recordedBy = recordedBy;
        this.requestId = requestId;
    }

    public UUID getId() { return id; }
    public UUID getGroupId() { return groupId; }
    public UUID getFromUser() { return fromUser; }
    public UUID getToUser() { return toUser; }
    public long getAmountMinor() { return amountMinor; }
    public Status getStatus() { return status; }
    public UUID getRecordedBy() { return recordedBy; }
    public UUID getConfirmedBy() { return confirmedBy; }
    public String getRequestId() { return requestId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getConfirmedAt() { return confirmedAt; }

    public void confirm(UUID by) {
        this.status = Status.CONFIRMED;
        this.confirmedBy = by;
        this.confirmedAt = Instant.now();
    }
}
