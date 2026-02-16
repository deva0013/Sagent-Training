package com.example.college_app.Entity;

import jakarta.persistence.*;
import java.sql.Time;

@Entity
@Table(name = "desired_course")
public class DesiredCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "course_type", nullable = false)
    private String courseType;

    private Time duration;

    // getters & setters
    public Integer getCourseId() { return courseId; }
    public void setCourseId(Integer courseId) { this.courseId = courseId; }

    public String getCourseType() { return courseType; }
    public void setCourseType(String courseType) { this.courseType = courseType; }

    public Time getDuration() { return duration; }
    public void setDuration(Time duration) { this.duration = duration; }
}

