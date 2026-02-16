package com.example.college_app.service;

import com.example.college_app.Entity.User;
import com.example.college_app.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User create(User user) {
        return userRepository.save(user);
    }

    @Override
    public List<User> getAll() {
        return userRepository.findAll();
    }

    @Override
    public User getById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    @Override
    public User update(Integer id, User updated) {
        User existing = getById(id);
        existing.setName(updated.getName());
        existing.setRole(updated.getRole());
        existing.setUsername(updated.getUsername());
        existing.setPassword(updated.getPassword());
        existing.setAge(updated.getAge());
        return userRepository.save(existing);
    }

    @Override
    public void delete(Integer id) {
        userRepository.deleteById(id);
    }
}

