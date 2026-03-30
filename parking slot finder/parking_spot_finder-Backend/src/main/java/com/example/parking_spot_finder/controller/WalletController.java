package com.example.parking_spot_finder.controller;

import com.example.parking_spot_finder.entity.Wallet;
import com.example.parking_spot_finder.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wallets")
public class WalletController {

    @Autowired
    private WalletService walletService;


    @PostMapping
    public Wallet addWallet(@RequestBody Wallet wallet) {
        return walletService.saveWallet(wallet);
    }


    @GetMapping
    public List<Wallet> getAllWallets() {
        return walletService.getAllWallets();
    }


    @GetMapping("/{id}")
    public ResponseEntity<Wallet> getWalletById(@PathVariable Long id) {
        return walletService.getWalletById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<Wallet> getWalletByUser(@PathVariable Long userId) {
        return walletService.getWalletByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @PutMapping("/{id}")
    public ResponseEntity<Wallet> updateWallet(
            @PathVariable Long id,
            @RequestBody Wallet wallet) {
        try {
            return ResponseEntity.ok(walletService.updateWallet(id, wallet));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


    @PostMapping("/{id}/topup")
    public ResponseEntity<?> topUp(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body) {
        try {
            BigDecimal amount = body.get("amount");
            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount"));
            }
            Wallet updated = walletService.topUp(id, amount);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }

    }
}
