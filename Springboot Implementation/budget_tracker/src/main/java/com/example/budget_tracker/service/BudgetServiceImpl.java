package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Budget;
import com.example.budget_tracker.repository.BudgetRepository;
import com.example.budget_tracker.service.BudgetService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository repo;

    public BudgetServiceImpl(BudgetRepository repo) {
        this.repo = repo;
    }

    @Override
    public Budget createBudget(Budget budget) {
        return repo.save(budget);
    }

    @Override
    public List<Budget> getAllBudgets() {
        return repo.findAll();
    }

    @Override
    public Budget getBudgetById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Budget not found: " + id));
    }

    @Override
    public void deleteBudget(Long id) {
        repo.deleteById(id);
    }
}

