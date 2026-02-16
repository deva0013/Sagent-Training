package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Income;
import com.example.budget_tracker.repository.IncomeRepository;
import com.example.budget_tracker.service.IncomeService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncomeServiceImpl implements IncomeService {

    private final IncomeRepository repo;

    public IncomeServiceImpl(IncomeRepository repo) {
        this.repo = repo;
    }

    @Override
    public Income createIncome(Income income) {
        return repo.save(income);
    }

    @Override
    public List<Income> getAllIncomes() {
        return repo.findAll();
    }

    @Override
    public Income getIncomeById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Income not found: " + id));
    }

    @Override
    public void deleteIncome(Long id) {
        repo.deleteById(id);
    }
}
