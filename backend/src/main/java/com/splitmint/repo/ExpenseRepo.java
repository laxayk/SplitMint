package com.splitmint.repo;

import com.splitmint.domain.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepo extends JpaRepository<Expense, UUID> {
    List<Expense> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
    Optional<Expense> findByCreatedByAndRequestId(UUID createdBy, String requestId);
}
