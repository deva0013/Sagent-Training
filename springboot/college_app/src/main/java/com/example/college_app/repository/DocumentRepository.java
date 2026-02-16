package com.example.college_app.repository;

import com.example.college_app.Entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Integer> {
}

