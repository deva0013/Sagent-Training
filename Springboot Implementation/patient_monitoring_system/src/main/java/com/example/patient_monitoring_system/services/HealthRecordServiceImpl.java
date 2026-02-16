package com.example.patient_monitoring_system.services;



import java.util.List;

import org.springframework.stereotype.Service;

import com.example.patient_monitoring_system.entity.HealthRecord;
import com.example.patient_monitoring_system.repository.HealthRecordRepository;
import com.example.patient_monitoring_system.services.HealthRecordService;

@Service
public class HealthRecordServiceImpl implements HealthRecordService {

    private final HealthRecordRepository repository;

    public HealthRecordServiceImpl(HealthRecordRepository repository) {
        this.repository = repository;
    }

    @Override
    public HealthRecord saveHealthRecord(HealthRecord record) {
        return repository.save(record);
    }

    @Override
    public List<HealthRecord> getAllHealthRecords() {
        return repository.findAll();
    }

    @Override
    public HealthRecord getHealthRecordById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public void deleteHealthRecord(Long id) {
        repository.deleteById(id);
    }
}

