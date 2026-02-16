package com.example.budget_tracker.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "goal_id")
    private Long goalId;

    @Column(name = "goal_name", nullable = false)
    private String goalName;

    @Column(name = "target_amount", nullable = false)
    private BigDecimal targetAmount;

    // 🔹 Foreign key → Account
    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    // ✅ Constructors
    public Goal() {}

    public Goal(Long goalId, String goalName, BigDecimal targetAmount, Account account) {
        this.goalId = goalId;
        this.goalName = goalName;
        this.targetAmount = targetAmount;
        this.account = account;
    }

    // ✅ Getters & Setters
    public Long getGoalId() { return goalId; }
    public void setGoalId(Long goalId) { this.goalId = goalId; }

    public String getGoalName() { return goalName; }
    public void setGoalName(String goalName) { this.goalName = goalName; }

    public BigDecimal getTargetAmount() { return targetAmount; }
    public void setTargetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; }

    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
}
