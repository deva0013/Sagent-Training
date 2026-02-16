package com.example.college_app.service;

import com.example.college_app.Entity.DesiredCourse;
import com.example.college_app.repository.DesiredCourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DesiredCourseServiceImpl implements DesiredCourseService {

    private final DesiredCourseRepository desiredCourseRepository;

    public DesiredCourseServiceImpl(DesiredCourseRepository desiredCourseRepository) {
        this.desiredCourseRepository = desiredCourseRepository;
    }

    @Override
    public DesiredCourse create(DesiredCourse course) {
        return desiredCourseRepository.save(course);
    }

    @Override
    public List<DesiredCourse> getAll() {
        return desiredCourseRepository.findAll();
    }

    @Override
    public DesiredCourse getById(Integer id) {
        return desiredCourseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
    }

    @Override
    public DesiredCourse update(Integer id, DesiredCourse updated) {
        DesiredCourse existing = getById(id);
        existing.setCourseType(updated.getCourseType());
        existing.setDuration(updated.getDuration());
        return desiredCourseRepository.save(existing);
    }

    @Override
    public void delete(Integer id) {
        desiredCourseRepository.deleteById(id);
    }
}

