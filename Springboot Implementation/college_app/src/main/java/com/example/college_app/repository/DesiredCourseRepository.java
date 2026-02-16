package com.example.college_app.repository;

import com.example.college_app.Entity.DesiredCourse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DesiredCourseRepository extends JpaRepository<DesiredCourse, Integer> {
}
