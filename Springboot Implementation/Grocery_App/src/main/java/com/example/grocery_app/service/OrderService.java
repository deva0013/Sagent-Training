package com.example.grocery_app.service;

import com.example.grocery_app.entity.Order;

import java.util.List;

public interface OrderService {

    Order addOrder(Order order);

    List<Order> getAllOrders();

    Order getOrderById(Long id);

    void deleteOrder(Long id);
}

