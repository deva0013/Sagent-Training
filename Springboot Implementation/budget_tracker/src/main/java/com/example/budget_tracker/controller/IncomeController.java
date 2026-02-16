package com.example.budget_tracker.controller;

import com.example.budget_tracker.entity.Income;
import com.example.budget_tracker.service.IncomeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeService service;

    public IncomeController(IncomeService service) {
        this.service = service;
    }

    @PostMapping
    public Income create(@RequestBody Income income) {
        return service.createIncome(income);
    }

    @GetMapping
    public List<Income> getAll() {
        return service.getAllIncomes();
    }

    @GetMapping("/{id}")
    public Income getById(@PathVariable Long id) {
        return service.getIncomeById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteIncome(id);
    }
}

