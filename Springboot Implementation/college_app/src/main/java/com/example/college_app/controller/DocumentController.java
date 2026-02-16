package com.example.college_app.controller;

import com.example.college_app.Entity.Document;
import com.example.college_app.service.DocumentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping
    public Document create(@RequestBody Document document) {
        return documentService.create(document);
    }

    @GetMapping
    public List<Document> getAll() {
        return documentService.getAll();
    }

    @GetMapping("/{id}")
    public Document getById(@PathVariable Integer id) {
        return documentService.getById(id);
    }

    @PutMapping("/{id}")
    public Document update(@PathVariable Integer id, @RequestBody Document document) {
        return documentService.update(id, document);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        documentService.delete(id);
        return "Document deleted: " + id;
    }
}
