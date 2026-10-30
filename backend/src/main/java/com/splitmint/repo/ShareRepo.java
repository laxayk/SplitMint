package com.splitmint.repo;

import com.splitmint.domain.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ShareRepo extends JpaRepository<ExpenseShare, ExpenseShare.Pk> {
    List<ExpenseShare> findByExpenseId(UUID expenseId);

    @Query("select s from ExpenseShare s where s.expenseId in (select e.id from Expense e where e.groupId = :groupId)")
    List<ExpenseShare> findAllForGroup(@Param("groupId") UUID groupId);
}
