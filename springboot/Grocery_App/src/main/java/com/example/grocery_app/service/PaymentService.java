package com.example.grocery_app.service;

import com.example.grocery_app.entity.Payment;

import java.util.List;

public interface PaymentService {

    Payment addPayment(Payment payment);

    List<Payment> getAllPayments();

    Payment getPaymentById(Long id);

    void deletePayment(Long id);
}
