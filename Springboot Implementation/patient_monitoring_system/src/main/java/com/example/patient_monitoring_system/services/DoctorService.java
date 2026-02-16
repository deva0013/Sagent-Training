package com.example.patient_monitoring_system.services;


import java.util.List;
import com.example.patient_monitoring_system.entity.Doctor;

public interface DoctorService {

    Doctor saveDoctor(Doctor doctor);

    List<Doctor> getAllDoctors();

    Doctor getDoctorById(Long id);

    void deleteDoctor(Long id);
}

