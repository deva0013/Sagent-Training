package com.example.grocery_app.repository;

import com.example.grocery_app.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountRepository extends JpaRepository<Discount, Long> {

}

