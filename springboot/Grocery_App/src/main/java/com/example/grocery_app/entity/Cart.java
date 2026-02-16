package com.example.grocery_app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "carts")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    private double cartTotal;

    // Many carts belong to one user
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Many carts can use one discount
    @ManyToOne
    @JoinColumn(name = "discount_id")
    private Discount discount;

    public Cart() {
    }

    // Getters and Setters

    public Long getCartId() {
        return cartId;
    }

    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }

    public double getCartTotal() {
        return cartTotal;
    }

    public void setCartTotal(double cartTotal) {
        this.cartTotal = cartTotal;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Discount getDiscount() {
        return discount;
    }

    public void setDiscount(Discount discount) {
        this.discount = discount;
    }
}
