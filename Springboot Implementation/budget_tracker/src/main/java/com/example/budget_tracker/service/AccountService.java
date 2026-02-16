package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Account;
import java.util.List;

public interface AccountService {
    Account createAccount(Account account);
    List<Account> getAllAccounts();
    Account getAccountById(Long id);
    void deleteAccount(Long id);
}

