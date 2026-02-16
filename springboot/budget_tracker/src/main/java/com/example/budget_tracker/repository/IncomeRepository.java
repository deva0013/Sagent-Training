package com.example.budget_tracker.repository;

import com.example.budget_tracker.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncomeRepository extends JpaRepository<Income, Long> {
}

