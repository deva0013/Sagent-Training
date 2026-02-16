package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.Account;
import com.example.budget_tracker.repository.AccountRepository;
import com.example.budget_tracker.service.AccountService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountRepository repo;

    public AccountServiceImpl(AccountRepository repo) {
        this.repo = repo;
    }

    @Override
    public Account createAccount(Account account) {
        return repo.save(account);
    }

    @Override
    public List<Account> getAllAccounts() {
        return repo.findAll();
    }

    @Override
    public Account getAccountById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Account not found: " + id));
    }

    @Override
    public void deleteAccount(Long id) {
        repo.deleteById(id);
    }
}

