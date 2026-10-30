package com.splitmint.repo;

import com.splitmint.domain.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MemberRepo extends JpaRepository<GroupMember, GroupMember.Pk> {
    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);
    List<GroupMember> findByGroupId(UUID groupId);
    List<GroupMember> findByUserId(UUID userId);
}
