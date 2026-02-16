package com.example.college_app.service;

import com.example.college_app.Entity.User;
import java.util.List;

public interface UserService {
    User create(User user);
    List<User> getAll();
    User getById(Integer id);
    User update(Integer id, User user);
    void delete(Integer id);
}
