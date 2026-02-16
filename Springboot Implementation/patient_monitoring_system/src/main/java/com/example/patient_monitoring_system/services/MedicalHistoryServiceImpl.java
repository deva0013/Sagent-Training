package com.example.patient_monitoring_system.services;



import java.util.List;

import org.springframework.stereotype.Service;

import com.example.patient_monitoring_system.entity.MedicalHistory;
import com.example.patient_monitoring_system.repository.MedicalHistoryRepository;
import com.example.patient_monitoring_system.services.MedicalHistoryService;

@Service
public class MedicalHistoryServiceImpl implements MedicalHistoryService {

    private final MedicalHistoryRepository repository;

    public MedicalHistoryServiceImpl(MedicalHistoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public MedicalHistory saveMedicalHistory(MedicalHistory history) {
        return repository.save(history);
    }

    @Override
    public List<MedicalHistory> getAllMedicalHistories() {
        return repository.findAll();
    }

    @Override
    public MedicalHistory getMedicalHistoryById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public void deleteMedicalHistory(Long id) {
        repository.deleteById(id);
    }
}

