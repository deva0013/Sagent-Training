package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Goal;
import com.example.budget_tracker.repository.GoalRepository;
import com.example.budget_tracker.service.GoalService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GoalServiceImpl implements GoalService {

    private final GoalRepository repo;

    public GoalServiceImpl(GoalRepository repo) {
        this.repo = repo;
    }

    @Override
    public Goal createGoal(Goal goal) {
        return repo.save(goal);
    }

    @Override
    public List<Goal> getAllGoals() {
        return repo.findAll();
    }

    @Override
    public Goal getGoalById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Goal not found: " + id));
    }

    @Override
    public void deleteGoal(Long id) {
        repo.deleteById(id);
    }
}
