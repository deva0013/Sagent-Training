package com.example.budget_tracker.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "account_type", nullable = false)
    private String accountType;

    @Column(name = "account_number", nullable = false, unique = true)
    private String accountNumber;

    // Foreign key → User table
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // constructor
    public Account() {}

    public Account(Long accountId, String accountType, String accountNumber, User user) {
        this.accountId = accountId;
        this.accountType = accountType;
        this.accountNumber = accountNumber;
        this.user = user;
    }

    // getters setters
    public Long getAccountId() { return accountId; }
    public void setAccountId(Long accountId) { this.accountId = accountId; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}

