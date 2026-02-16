package com.example.college_app.service;

import com.example.college_app.Entity.Application;
import java.util.List;

public interface ApplicationService {
    Application create(Application application);
    List<Application> getAll();
    Application getById(Integer id);
    Application update(Integer id, Application application);
    void delete(Integer id);
}

