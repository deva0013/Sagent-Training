package com.example.patient_monitoring_system.services;



import java.util.List;
import com.example.patient_monitoring_system.entity.HealthRecord;

public interface HealthRecordService {

    HealthRecord saveHealthRecord(HealthRecord record);

    List<HealthRecord> getAllHealthRecords();

    HealthRecord getHealthRecordById(Long id);

    void deleteHealthRecord(Long id);
}

