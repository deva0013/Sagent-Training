package com.example.library_management.service;

import com.example.library_management.entity.BookIssue;
import com.example.library_management.repository.BookIssueRepository;
import com.example.library_management.service.BookIssueService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookIssueServiceImpl implements BookIssueService {

    private final BookIssueRepository bookIssueRepository;

    public BookIssueServiceImpl(BookIssueRepository bookIssueRepository) {
        this.bookIssueRepository = bookIssueRepository;
    }

    @Override
    public BookIssue createIssue(BookIssue issue) {
        return bookIssueRepository.save(issue);
    }

    @Override
    public BookIssue getIssueById(Long id) {
        return bookIssueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));
    }

    @Override
    public List<BookIssue> getAllIssues() {
        return bookIssueRepository.findAll();
    }

    @Override
    public List<BookIssue> getIssuesByUserId(Long userId) {
        return bookIssueRepository.findByUserUserId(userId);
    }

    @Override
    public List<BookIssue> getIssuesByBookId(Long bookId) {
        return bookIssueRepository.findByBookBookId(bookId);
    }

    @Override
    public List<BookIssue> getIssuesByStatus(String status) {
        return bookIssueRepository.findByStatus(status);
    }

    @Override
    public BookIssue updateIssue(Long id, BookIssue issue) {
        BookIssue existing = getIssueById(id);
        existing.setUser(issue.getUser());
        existing.setBook(issue.getBook());
        existing.setIssueDate(issue.getIssueDate());
        existing.setReturnDate(issue.getReturnDate());
        existing.setDueDate(issue.getDueDate());
        existing.setFineAmount(issue.getFineAmount());
        existing.setStatus(issue.getStatus());
        return bookIssueRepository.save(existing);
    }

    @Override
    public void deleteIssue(Long id) {
        BookIssue existing = getIssueById(id);
        bookIssueRepository.delete(existing);
    }
}

