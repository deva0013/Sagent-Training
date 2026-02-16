package com.example.grocery_app.repository;

import com.example.grocery_app.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

}
