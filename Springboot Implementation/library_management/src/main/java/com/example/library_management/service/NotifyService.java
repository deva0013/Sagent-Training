package com.example.library_management.service;

import com.example.library_management.entity.Notify;
import java.util.List;

public interface NotifyService {
    Notify createNotify(Notify notify);
    Notify getNotifyById(Long id);
    List<Notify> getAllNotifications();
    List<Notify> getNotificationsByUserId(Long userId);
    List<Notify> getNotificationsByIssueId(Long bookIssueId);
    Notify updateNotify(Long id, Notify notify);
    void deleteNotify(Long id);
}
