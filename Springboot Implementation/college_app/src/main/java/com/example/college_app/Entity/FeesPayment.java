package com.example.college_app.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fees_payment")
public class FeesPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fees_payment_id")
    private Integer feesPaymentId;

    @Column(name = "pay_method", nullable = false)
    private String payMethod;

    @Column(nullable = false)
    private String status;

    // FK fees_payment.form_id -> application.form_id
    @OneToOne
    @JoinColumn(name = "form_id", referencedColumnName = "form_Id")
    private Application application;

    // getters & setters
    public Integer getFeesPaymentId() { return feesPaymentId; }
    public void setFeesPaymentId(Integer feesPaymentId) { this.feesPaymentId = feesPaymentId; }

    public String getPayMethod() { return payMethod; }
    public void setPayMethod(String payMethod) { this.payMethod = payMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
}

