package com.example.budget_tracker.service;

import com.example.budget_tracker.entity.User;
import com.example.budget_tracker.repository.UserRepository;
import com.example.budget_tracker.service.UserService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository repo;

    public UserServiceImpl(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public User createUser(User user) {
        return repo.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return repo.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    @Override
    public void deleteUser(Long id) {
        repo.deleteById(id);
    }
}

