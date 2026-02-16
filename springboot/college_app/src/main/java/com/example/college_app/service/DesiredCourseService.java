package com.example.college_app.service;

import com.example.college_app.Entity.DesiredCourse;
import java.util.List;

public interface DesiredCourseService {
    DesiredCourse create(DesiredCourse course);
    List<DesiredCourse> getAll();
    DesiredCourse getById(Integer id);
    DesiredCourse update(Integer id, DesiredCourse course);
    void delete(Integer id);
}

