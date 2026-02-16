package com.example.college_app.service;

import com.example.college_app.Entity.Document;
import java.util.List;

public interface DocumentService {
    Document create(Document document);
    List<Document> getAll();
    Document getById(Integer id);
    Document update(Integer id, Document document);
    void delete(Integer id);
}

