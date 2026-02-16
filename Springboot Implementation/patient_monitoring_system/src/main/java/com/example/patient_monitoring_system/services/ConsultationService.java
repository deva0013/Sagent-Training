package com.example.patient_monitoring_system.services;



import java.util.List;
import com.example.patient_monitoring_system.entity.Consultation;

public interface ConsultationService {

    Consultation saveConsultation(Consultation consultation);

    List<Consultation> getAllConsultations();

    Consultation getConsultationById(Long id);

    void deleteConsultation(Long id);
}

