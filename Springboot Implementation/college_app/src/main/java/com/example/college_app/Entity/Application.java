package com.example.college_app.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "application")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "app_id")
    private Integer appId;

    private String name;

    @Column(name = "dob")
    private LocalDateTime dob;

    private String address;
    private String percentage;
    private String subject;
    private String status;

    // This is used to connect fees_payment
    @Column(name = "form_id", nullable = false, unique = true)
    private Integer formId;

    // FK -> users.user_id
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // FK -> desired_course.course_id
    @ManyToOne
    @JoinColumn(name = "course_id")
    private DesiredCourse course;

    // FK -> document.document_id
    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;

    // getters & setters
    public Integer getAppId() { return appId; }
    public void setAppId(Integer appId) { this.appId = appId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDateTime getDob() { return dob; }
    public void setDob(LocalDateTime dob) { this.dob = dob; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPercentage() { return percentage; }
    public void setPercentage(String percentage) { this.percentage = percentage; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getFormId() { return formId; }
    public void setFormId(Integer formId) { this.formId = formId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public DesiredCourse getCourse() { return course; }
    public void setCourse(DesiredCourse course) { this.course = course; }

    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }
}
