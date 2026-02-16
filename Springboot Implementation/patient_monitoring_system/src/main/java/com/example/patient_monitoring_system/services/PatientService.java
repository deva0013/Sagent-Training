package com.example.patient_monitoring_system.services;

import java.util.List;
import com.example.patient_monitoring_system.entity.Patient;

public interface PatientService {

    Patient savePatient(Patient patient);

    List<Patient> getAllPatients();

    Patient getPatientById(Long id);

    void deletePatient(Long id);
}

