package com.example.parking_spot_finder.repository;

import com.example.parking_spot_finder.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
}
