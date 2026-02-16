package com.example.budget_tracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "incomes")
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "income_id")
    private Long incomeId;

    @Column(name = "income_type", nullable = false)
    private String incomeType;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "income_date")
    private LocalDate incomeDate = LocalDate.now();

    // 🔹 Foreign key → User
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 🔹 Foreign key → Account
    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    // ✅ Constructor
    public Income() {}

    public Income(Long incomeId, String incomeType, BigDecimal amount,
                  LocalDate incomeDate, User user, Account account) {
        this.incomeId = incomeId;
        this.incomeType = incomeType;
        this.amount = amount;
        this.incomeDate = incomeDate;
        this.user = user;
        this.account = account;
    }

    // ✅ Getters + Setters
    public Long getIncomeId() { return incomeId; }
    public void setIncomeId(Long incomeId) { this.incomeId = incomeId; }

    public String getIncomeType() { return incomeType; }
    public void setIncomeType(String incomeType) { this.incomeType = incomeType; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getIncomeDate() { return incomeDate; }
    public void setIncomeDate(LocalDate incomeDate) { this.incomeDate = incomeDate; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
}

