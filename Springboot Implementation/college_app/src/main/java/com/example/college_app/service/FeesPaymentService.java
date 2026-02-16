package com.example.college_app.service;

import com.example.college_app.Entity.FeesPayment;
import java.util.List;

public interface FeesPaymentService {
    FeesPayment create(FeesPayment payment);
    List<FeesPayment> getAll();
    FeesPayment getById(Integer id);
    FeesPayment update(Integer id, FeesPayment payment);
    void delete(Integer id);
}

