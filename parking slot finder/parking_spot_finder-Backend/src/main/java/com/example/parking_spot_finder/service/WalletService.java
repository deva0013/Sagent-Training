package com.example.parking_spot_finder.service;

import com.example.parking_spot_finder.entity.Wallet;
import com.example.parking_spot_finder.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WalletService {

    @Autowired
    private WalletRepository walletRepository;

    public Wallet saveWallet(Wallet wallet) {
        return walletRepository.save(wallet);
    }

    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    public Optional<Wallet> getWalletById(Long id) {
        return walletRepository.findById(id);
    }

    public Optional<Wallet> getWalletByUserId(Long userId) {
        return walletRepository.findByUserUserId(userId);
    }


    public Wallet updateWallet(Long id, Wallet updated) {
        updated.setWalletId(id);
        updated.setLastUpdated(LocalDateTime.now());
        return walletRepository.save(updated);
    }


    public Wallet topUp(Long walletId, BigDecimal amount) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastUpdated(LocalDateTime.now());
        return walletRepository.save(wallet);
    }
}