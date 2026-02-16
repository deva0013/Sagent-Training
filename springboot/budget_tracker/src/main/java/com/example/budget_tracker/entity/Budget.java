package com.example.budget_tracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "budget")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "budget_id")
    private Long budgetId;

    @Column(nullable = false)
    private String category;

    @Column(name = "budget_limit", nullable = false)
    private BigDecimal budgetLimit;

    // 🔹 Foreign key → Income
    @ManyToOne
    @JoinColumn(name = "income_id", nullable = false)
    private Income income;

    // constructor
    public Budget() {}

    public Budget(Long budgetId, String category, BigDecimal budgetLimit, Income income) {
        this.budgetId = budgetId;
        this.category = category;
        this.budgetLimit = budgetLimit;
        this.income = income;
    }

    // getters setters
    public Long getBudgetId() { return budgetId; }
    public void setBudgetId(Long budgetId) { this.budgetId = budgetId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getBudgetLimit() { return budgetLimit; }
    public void setBudgetLimit(BigDecimal budgetLimit) { this.budgetLimit = budgetLimit; }

    public Income getIncome() { return income; }
    public void setIncome(Income income) { this.income = income; }
}

