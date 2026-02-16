package com.example.grocery_app.service;

import com.example.grocery_app.entity.Discount;

import java.util.List;

public interface DiscountService {

    Discount addDiscount(Discount discount);

    List<Discount> getAllDiscounts();

    Discount getDiscountById(Long id);

    void deleteDiscount(Long id);
}


