package com.example.grocery_app.service;

import com.example.grocery_app.entity.Cart;

import java.util.List;

public interface CartService {

    Cart addCart(Cart cart);

    List<Cart> getAllCarts();

    Cart getCartById(Long id);

    void deleteCart(Long id);
}
