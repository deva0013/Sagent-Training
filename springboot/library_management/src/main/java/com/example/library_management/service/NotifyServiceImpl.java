package com.example.library_management.service;

import com.example.library_management.entity.Notify;
import com.example.library_management.repository.NotifyRepository;
import com.example.library_management.service.NotifyService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotifyServiceImpl implements NotifyService {

    private final NotifyRepository notifyRepository;

    public NotifyServiceImpl(NotifyRepository notifyRepository) {
        this.notifyRepository = notifyRepository;
    }

    @Override
    public Notify createNotify(Notify notify) {
        return notifyRepository.save(notify);
    }

    @Override
    public Notify getNotifyById(Long id) {
        return notifyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    @Override
    public List<Notify> getAllNotifications() {
        return notifyRepository.findAll();
    }

    @Override
    public List<Notify> getNotificationsByUserId(Long userId) {
        return notifyRepository.findByUserUserId(userId);
    }

    @Override
    public List<Notify> getNotificationsByIssueId(Long bookIssueId) {
        return notifyRepository.findByBookIssueBookIssueId(bookIssueId);
    }

    @Override
    public Notify updateNotify(Long id, Notify notify) {
        Notify existing = getNotifyById(id);
        existing.setMessage(notify.getMessage());
        existing.setSentAt(notify.getSentAt());
        existing.setBookIssue(notify.getBookIssue());
        existing.setUser(notify.getUser());
        return notifyRepository.save(existing);
    }

    @Override
    public void deleteNotify(Long id) {
        Notify existing = getNotifyById(id);
        notifyRepository.delete(existing);
    }
}

