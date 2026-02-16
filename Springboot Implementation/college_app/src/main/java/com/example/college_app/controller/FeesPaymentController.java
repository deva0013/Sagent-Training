package com.example.college_app.controller;

import com.example.college_app.Entity.FeesPayment;
import com.example.college_app.service.FeesPaymentServiceImpl;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class FeesPaymentController {

    private final FeesPaymentServiceImpl feesPaymentService;

    public FeesPaymentController(FeesPaymentServiceImpl feesPaymentService) {
        this.feesPaymentService = feesPaymentService;
    }

    @PostMapping
    public FeesPayment create(@RequestBody FeesPayment payment) {
        return feesPaymentService.create(payment);
    }

    @GetMapping
    public List<FeesPayment> getAllPayments() {
        return feesPaymentService.getAll();
    }
}
