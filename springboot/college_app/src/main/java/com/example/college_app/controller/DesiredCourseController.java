package com.example.college_app.controller;

import com.example.college_app.Entity.DesiredCourse;
import com.example.college_app.service.DesiredCourseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class DesiredCourseController {

    private final DesiredCourseService desiredCourseService;

    public DesiredCourseController(DesiredCourseService desiredCourseService) {
        this.desiredCourseService = desiredCourseService;
    }

    @PostMapping
    public DesiredCourse create(@RequestBody DesiredCourse course) {
        return desiredCourseService.create(course);
    }

    @GetMapping
    public List<DesiredCourse> getAll() {
        return desiredCourseService.getAll();
    }

    @GetMapping("/{id}")
    public DesiredCourse getById(@PathVariable Integer id) {
        return desiredCourseService.getById(id);
    }

    @PutMapping("/{id}")
    public DesiredCourse update(@PathVariable Integer id, @RequestBody DesiredCourse course) {
        return desiredCourseService.update(id, course);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        desiredCourseService.delete(id);
        return "Course deleted: " + id;
    }
}
