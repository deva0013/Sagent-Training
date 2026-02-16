package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Expense;
import java.util.List;

public interface ExpenseService {
    Expense createExpense(Expense expense);
    List<Expense> getAllExpenses();
    Expense getExpenseById(Long id);
    void deleteExpense(Long id);
}
