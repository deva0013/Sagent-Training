package com.example.grocery_app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "discounts")
public class Discount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long discountId;

    private String discountOfferType;
    private double discountPercentage;

    public Discount() {
    }

    // Getters and Setters

    public Long getDiscountId() {
        return discountId;
    }

    public void setDiscountId(Long discountId) {
        this.discountId = discountId;
    }

    public String getDiscountOfferType() {
        return discountOfferType;
    }

    public void setDiscountOfferType(String discountOfferType) {
        this.discountOfferType = discountOfferType;
    }

    public double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(double discountPercentage) {
        this.discountPercentage = discountPercentage;
    }
}
