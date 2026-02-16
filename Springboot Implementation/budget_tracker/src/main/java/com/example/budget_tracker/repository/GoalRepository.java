package com.example.budget_tracker.repository;

import com.example.budget_tracker.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoalRepository extends JpaRepository<Goal, Long> {
}
