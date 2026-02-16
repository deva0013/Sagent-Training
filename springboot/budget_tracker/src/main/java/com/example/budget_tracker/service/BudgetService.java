package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Budget;
import java.util.List;

public interface BudgetService {
    Budget createBudget(Budget budget);
    List<Budget> getAllBudgets();
    Budget getBudgetById(Long id);
    void deleteBudget(Long id);
}

