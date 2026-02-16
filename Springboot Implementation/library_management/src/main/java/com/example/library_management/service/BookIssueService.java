package com.example.library_management.service;

import com.example.library_management.entity.BookIssue;
import java.util.List;

public interface BookIssueService {
    BookIssue createIssue(BookIssue issue);
    BookIssue getIssueById(Long id);
    List<BookIssue> getAllIssues();
    List<BookIssue> getIssuesByUserId(Long userId);
    List<BookIssue> getIssuesByBookId(Long bookId);
    List<BookIssue> getIssuesByStatus(String status);
    BookIssue updateIssue(Long id, BookIssue issue);
    void deleteIssue(Long id);
}

