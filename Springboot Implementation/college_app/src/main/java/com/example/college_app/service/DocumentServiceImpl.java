package com.example.college_app.service;

import com.example.college_app.Entity.Document;
import com.example.college_app.repository.DocumentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;

    public DocumentServiceImpl(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @Override
    public Document create(Document document) {
        return documentRepository.save(document);
    }

    @Override
    public List<Document> getAll() {
        return documentRepository.findAll();
    }

    @Override
    public Document getById(Integer id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    @Override
    public Document update(Integer id, Document updated) {
        Document existing = getById(id);
        existing.setFile(updated.getFile());
        return documentRepository.save(existing);
    }

    @Override
    public void delete(Integer id) {
        documentRepository.deleteById(id);
    }
}

