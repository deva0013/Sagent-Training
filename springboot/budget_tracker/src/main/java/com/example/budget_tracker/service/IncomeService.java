package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Income;
import java.util.List;

public interface IncomeService {
    Income createIncome(Income income);
    List<Income> getAllIncomes();
    Income getIncomeById(Long id);
    void deleteIncome(Long id);
}
