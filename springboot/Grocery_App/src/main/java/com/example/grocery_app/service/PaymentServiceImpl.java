package com.example.grocery_app.service;

import com.example.grocery_app.entity.Payment;
import com.example.grocery_app.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    public Payment addPayment(Payment payment) {
        return paymentRepository.save(payment);
    }

    @Override
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @Override
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id).orElse(null);
    }

    @Override
    public void deletePayment(Long id) {
        paymentRepository.deleteById(id);
    }
}

