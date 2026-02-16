package com.example.budget_tracker.repository;

import com.example.budget_tracker.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
}

