package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Goal;
import java.util.List;

public interface GoalService {
    Goal createGoal(Goal goal);
    List<Goal> getAllGoals();
    Goal getGoalById(Long id);
    void deleteGoal(Long id);
}
