package com.example.college_app.controller;

import com.example.college_app.Entity.Application;
import com.example.college_app.service.ApplicationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public Application create(@RequestBody Application application) {
        return applicationService.create(application);
    }

    @GetMapping
    public List<Application> getAll() {
        return applicationService.getAll();
    }

    @GetMapping("/{id}")
    public Application getById(@PathVariable Integer id) {
        return applicationService.getById(id);
    }

    @PutMapping("/{id}")
    public Application update(@PathVariable Integer id, @RequestBody Application application) {
        return applicationService.update(id, application);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        applicationService.delete(id);
        return "Application deleted: " + id;
    }
}
