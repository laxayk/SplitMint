package com.splitmint.repo;

import com.splitmint.domain.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GroupRepo extends JpaRepository<ExpenseGroup, UUID> {}
