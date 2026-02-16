package com.example.college_app.service;

import com.example.college_app.Entity.Application;
import com.example.college_app.repository.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Application create(Application application) {
        return applicationRepository.save(application);
    }

    @Override
    public List<Application> getAll() {
        return applicationRepository.findAll();
    }

    @Override
    public Application getById(Integer id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));
    }

    @Override
    public Application update(Integer id, Application updated) {
        Application existing = getById(id);

        existing.setName(updated.getName());
        existing.setDob(updated.getDob());
        existing.setAddress(updated.getAddress());
        existing.setPercentage(updated.getPercentage());
        existing.setSubject(updated.getSubject());
        existing.setStatus(updated.getStatus());
        existing.setFormId(updated.getFormId());

        existing.setUser(updated.getUser());
        existing.setCourse(updated.getCourse());
        existing.setDocument(updated.getDocument());

        return applicationRepository.save(existing);
    }

    @Override
    public void delete(Integer id) {
        applicationRepository.deleteById(id);
    }
}

