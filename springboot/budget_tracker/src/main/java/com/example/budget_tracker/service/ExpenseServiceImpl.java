package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Expense;
import com.example.budget_tracker.repository.ExpenseRepository;
import com.example.budget_tracker.service.ExpenseService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository repo;

    public ExpenseServiceImpl(ExpenseRepository repo) {
        this.repo = repo;
    }

    @Override
    public Expense createExpense(Expense expense) {
        return repo.save(expense);
    }

    @Override
    public List<Expense> getAllExpenses() {
        return repo.findAll();
    }

    @Override
    public Expense getExpenseById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Expense not found: " + id));
    }

    @Override
    public void deleteExpense(Long id) {
        repo.deleteById(id);
    }
}

