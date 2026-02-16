package com.example.budget_tracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "expense_id")
    private Long expenseId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "expense_date")
    private LocalDate expenseDate = LocalDate.now();

    // 🔹 Foreign key → User
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 🔹 Foreign key → Account
    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    // ✅ Constructor
    public Expense() {}

    public Expense(Long expenseId, String category, BigDecimal amount,
                   LocalDate expenseDate, User user, Account account) {
        this.expenseId = expenseId;
        this.category = category;
        this.amount = amount;
        this.expenseDate = expenseDate;
        this.user = user;
        this.account = account;
    }

    // ✅ Getters & Setters
    public Long getExpenseId() { return expenseId; }
    public void setExpenseId(Long expenseId) { this.expenseId = expenseId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
}
