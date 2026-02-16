package com.example.patient_monitoring_system.services;



import java.util.List;
import com.example.patient_monitoring_system.entity.MedicalHistory;

public interface MedicalHistoryService {

    MedicalHistory saveMedicalHistory(MedicalHistory history);

    List<MedicalHistory> getAllMedicalHistories();

    MedicalHistory getMedicalHistoryById(Long id);

    void deleteMedicalHistory(Long id);
}

