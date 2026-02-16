package com.example.library_management.controller;

import com.example.library_management.entity.Notify;
import com.example.library_management.service.NotifyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotifyController {

    private final NotifyService notifyService;

    public NotifyController(NotifyService notifyService) {
        this.notifyService = notifyService;
    }

    // CREATE
    @PostMapping
    public Notify createNotify(@RequestBody Notify notify) {
        return notifyService.createNotify(notify);
    }

    // GET BY ID
    @GetMapping("/{id}")
    public Notify getNotifyById(@PathVariable Long id) {
        return notifyService.getNotifyById(id);
    }

    // GET ALL
    @GetMapping
    public List<Notify> getAllNotifications() {
        return notifyService.getAllNotifications();
    }

    // GET BY USER ID
    @GetMapping("/user/{userId}")
    public List<Notify> getByUser(@PathVariable Long userId) {
        return notifyService.getNotificationsByUserId(userId);
    }

    // GET BY ISSUE ID
    @GetMapping("/issue/{issueId}")
    public List<Notify> getByIssue(@PathVariable Long issueId) {
        return notifyService.getNotificationsByIssueId(issueId);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Notify updateNotify(@PathVariable Long id, @RequestBody Notify notify) {
        return notifyService.updateNotify(id, notify);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteNotify(@PathVariable Long id) {
        notifyService.deleteNotify(id);
    }
}

