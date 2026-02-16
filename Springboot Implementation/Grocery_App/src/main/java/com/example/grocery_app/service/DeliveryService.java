package com.example.grocery_app.service;

import com.example.grocery_app.entity.Delivery;

import java.util.List;

public interface DeliveryService {

    Delivery addDelivery(Delivery delivery);

    List<Delivery> getAllDeliveries();

    Delivery getDeliveryById(Long id);

    void deleteDelivery(Long id);
}

