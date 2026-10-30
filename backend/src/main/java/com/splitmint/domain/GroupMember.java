package com.splitmint.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_member")
@IdClass(GroupMember.Pk.class)
public class GroupMember {

    public static class Pk implements Serializable {
        private UUID groupId;
        private UUID userId;
        public Pk() {}
        public Pk(UUID groupId, UUID userId) { this.groupId = groupId; this.userId = userId; }
    }

    @Id
    private UUID groupId;
    @Id
    private UUID userId;
    @Column(nullable = false)
    private Instant joinedAt = Instant.now();

    protected GroupMember() {}

    public GroupMember(UUID groupId, UUID userId) {
        this.groupId = groupId;
        this.userId = userId;
    }

    public UUID getGroupId() { return groupId; }
    public UUID getUserId() { return userId; }
    public Instant getJoinedAt() { return joinedAt; }
}
