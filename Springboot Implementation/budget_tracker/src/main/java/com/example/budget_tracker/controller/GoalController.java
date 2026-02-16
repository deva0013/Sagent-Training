package com.example.budget_tracker.controller;

import com.example.budget_tracker.entity.Goal;
import com.example.budget_tracker.service.GoalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    @PostMapping
    public Goal create(@RequestBody Goal goal) {
        return service.createGoal(goal);
    }

    @GetMapping
    public List<Goal> getAll() {
        return service.getAllGoals();
    }

    @GetMapping("/{id}")
    public Goal getById(@PathVariable Long id) {
        return service.getGoalById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteGoal(id);
    }
}

