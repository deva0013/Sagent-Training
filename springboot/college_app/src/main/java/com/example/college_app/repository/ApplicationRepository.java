package com.example.college_app.repository;

import com.example.college_app.Entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    Application findByFormId(Integer formId);
}


