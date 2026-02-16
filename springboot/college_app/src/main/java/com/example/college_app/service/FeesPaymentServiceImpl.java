package com.example.college_app.service;

import com.example.college_app.Entity.Application;
import com.example.college_app.Entity.FeesPayment;
import com.example.college_app.repository.ApplicationRepository;
import com.example.college_app.repository.FeesPaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeesPaymentServiceImpl {

    private final FeesPaymentRepository feesPaymentRepository;
    private final ApplicationRepository applicationRepository;

    public FeesPaymentServiceImpl(FeesPaymentRepository feesPaymentRepository,
                                  ApplicationRepository applicationRepository) {
        this.feesPaymentRepository = feesPaymentRepository;
        this.applicationRepository = applicationRepository;
    }

    public FeesPayment create(FeesPayment payment) {

        Integer formId = payment.getApplication().getFormId();

        Application app = applicationRepository.findByFormId(formId);
        if (app == null) {
            throw new RuntimeException("Application not found for formId: " + formId);
        }

        payment.setApplication(app);

        return feesPaymentRepository.save(payment);
    }

    public List<FeesPayment> getAll() {
        return feesPaymentRepository.findAll();
    }
}
