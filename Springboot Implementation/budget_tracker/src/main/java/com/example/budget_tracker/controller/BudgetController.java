package com.example.budget_tracker.controller;

import com.example.budget_tracker.entity.Budget;
import com.example.budget_tracker.service.BudgetService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService service;

    public BudgetController(BudgetService service) {
        this.service = service;
    }

    @PostMapping
    public Budget create(@RequestBody Budget budget) {
        return service.createBudget(budget);
    }

    @GetMapping
    public List<Budget> getAll() {
        return service.getAllBudgets();
    }

    @GetMapping("/{id}")
    public Budget getById(@PathVariable Long id) {
        return service.getBudgetById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteBudget(id);
    }
}
