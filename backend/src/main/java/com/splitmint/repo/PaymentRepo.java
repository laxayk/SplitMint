package com.splitmint.repo;

import com.splitmint.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepo extends JpaRepository<Payment, UUID> {
    List<Payment> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
    boolean existsByGroupId(UUID groupId);
    Optional<Payment> findByRecordedByAndRequestId(UUID recordedBy, String requestId);
}
