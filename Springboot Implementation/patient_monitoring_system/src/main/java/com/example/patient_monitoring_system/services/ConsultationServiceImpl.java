package com.example.patient_monitoring_system.services;



import java.util.List;

import org.springframework.stereotype.Service;

import com.example.patient_monitoring_system.entity.Consultation;
import com.example.patient_monitoring_system.repository.ConsultationRepository;
import com.example.patient_monitoring_system.services.ConsultationService;

@Service
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationRepository repository;

    public ConsultationServiceImpl(ConsultationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Consultation saveConsultation(Consultation consultation) {
        return repository.save(consultation);
    }

    @Override
    public List<Consultation> getAllConsultations() {
        return repository.findAll();
    }

    @Override
    public Consultation getConsultationById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public void deleteConsultation(Long id) {
        repository.deleteById(id);
    }
}

