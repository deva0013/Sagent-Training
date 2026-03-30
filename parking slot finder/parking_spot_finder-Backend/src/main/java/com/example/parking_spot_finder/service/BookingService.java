package com.example.parking_spot_finder.service;

import com.example.parking_spot_finder.entity.Booking;
import com.example.parking_spot_finder.entity.ParkingSlot;
import com.example.parking_spot_finder.entity.User;
import com.example.parking_spot_finder.entity.Wallet;
import com.example.parking_spot_finder.entity.WalletTransaction;
import com.example.parking_spot_finder.repository.BookingRepository;
import com.example.parking_spot_finder.repository.ParkingSlotRepository;
import com.example.parking_spot_finder.repository.UserRepository;
import com.example.parking_spot_finder.repository.WalletRepository;
import com.example.parking_spot_finder.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    private static final BigDecimal ADMIN_COMMISSION_RATE = new BigDecimal("0.10");
    private static final BigDecimal LENDER_RATE           = new BigDecimal("0.90");

    // Late fee: 5 min grace, then ₹3 per minute after grace
    private static final int GRACE_MINUTES      = 5;
    private static final BigDecimal FEE_PER_MIN = new BigDecimal("3"); // ₹3 per minute

    @Autowired private BookingRepository           bookingRepository;
    @Autowired private WalletRepository            walletRepository;
    @Autowired private WalletTransactionRepository transactionRepository;
    @Autowired private ParkingSlotRepository       parkingSlotRepository;
    @Autowired private UserRepository              userRepository;

    public Booking saveBooking(Booking b)              { return bookingRepository.save(b); }
    public List<Booking> getAllBookings()               { return bookingRepository.findAll(); }
    public Optional<Booking> getBookingById(Long id)   { return bookingRepository.findById(id); }
    public List<Booking> getBookingsByUserId(Long uid) { return bookingRepository.findByUserUserId(uid); }
    public Booking updateBooking(Long id, Booking b)   { b.setBookingId(id); return bookingRepository.save(b); }

    // ── LATE FEE ─────────────────────────────────────────────────────
    // 5 min grace → ₹3 per minute after grace → max 2× estimatedAmt
    // Example: 10 min late = 5 chargeable minutes × ₹3 = ₹15
    //          1 hr late   = 55 chargeable minutes × ₹3 = ₹165 (or capped at 2× booking)
    public BigDecimal calculateLateFee(Long bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime end = b.getEndTime();

        if (end == null || !now.isAfter(end)) return BigDecimal.ZERO;

        long lateMinutes = ChronoUnit.MINUTES.between(end, now);
        if (lateMinutes <= GRACE_MINUTES) return BigDecimal.ZERO;

        long chargeableMinutes = lateMinutes - GRACE_MINUTES;
        BigDecimal fee         = FEE_PER_MIN.multiply(BigDecimal.valueOf(chargeableMinutes));

        // Cap at 2× estimated amount
        BigDecimal estimated = b.getEstimatedAmt() != null ? b.getEstimatedAmt() : BigDecimal.ZERO;
        BigDecimal maxFine   = estimated.multiply(new BigDecimal("2"));
        if (maxFine.compareTo(BigDecimal.ZERO) > 0 && fee.compareTo(maxFine) > 0) {
            fee = maxFine;
        }
        return fee.setScale(2, RoundingMode.HALF_UP);
    }

    // ── CREATE BOOKING WITH INITIAL PAYMENT ──────────────────────────
    @Transactional
    public Booking createBookingWithPayment(Booking booking) {
        BigDecimal initial = booking.getAdditionalFee();
        if (initial == null || initial.compareTo(BigDecimal.ZERO) <= 0) {
            return bookingRepository.save(booking);
        }
        Wallet userWallet = walletRepository.findByUserUserId(booking.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("User wallet not found"));
        if (userWallet.getBalance().compareTo(initial) < 0)
            throw new RuntimeException("Insufficient balance. Need ₹" + initial);

        LocalDateTime now = LocalDateTime.now();
        userWallet.setBalance(userWallet.getBalance().subtract(initial));
        userWallet.setLastUpdated(now);
        walletRepository.save(userWallet);

        Booking saved = bookingRepository.save(booking);
        saveTx(userWallet, saved, initial, "DEBIT", "INITIAL_PAYMENT", now);

        BigDecimal lenderCut = initial.multiply(LENDER_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal adminCut  = initial.subtract(lenderCut);
        creditLender(saved, lenderCut, now);
        creditAdmin(saved, adminCut, "COMMISSION", now);
        return saved;
    }

    // ── CHECKOUT ─────────────────────────────────────────────────────
    @Transactional
    public Booking checkout(Long bookingId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        if ("COMPLETED".equals(b.getCheckoutStatus())) throw new RuntimeException("Already checked out");
        if ("CANCELLED".equals(b.getBookingStatus()))  throw new RuntimeException("Booking is cancelled");

        LocalDateTime now      = LocalDateTime.now();
        BigDecimal lateFee     = calculateLateFee(bookingId);
        BigDecimal estimated   = b.getEstimatedAmt()  != null ? b.getEstimatedAmt()  : BigDecimal.ZERO;
        BigDecimal initialPaid = b.getAdditionalFee() != null ? b.getAdditionalFee() : BigDecimal.ZERO;
        BigDecimal remaining   = estimated.subtract(initialPaid).max(BigDecimal.ZERO);
        BigDecimal totalDue    = remaining.add(lateFee);

        if (totalDue.compareTo(BigDecimal.ZERO) > 0) {
            Wallet userWallet = walletRepository.findByUserUserId(b.getUser().getUserId())
                    .orElseThrow(() -> new RuntimeException("Wallet not found"));
            if (userWallet.getBalance().compareTo(totalDue) < 0)
                throw new RuntimeException("Insufficient balance. Need ₹" + totalDue + ", have ₹" + userWallet.getBalance());
            userWallet.setBalance(userWallet.getBalance().subtract(totalDue));
            userWallet.setLastUpdated(now);
            walletRepository.save(userWallet);
            if (remaining.compareTo(BigDecimal.ZERO) > 0) saveTx(userWallet, b, remaining, "DEBIT", "REMAINING_PAYMENT", now);
            if (lateFee.compareTo(BigDecimal.ZERO)   > 0) saveTx(userWallet, b, lateFee,   "DEBIT", "LATE_FEE",           now);
        }

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal lenderCut = remaining.multiply(LENDER_RATE).setScale(2, RoundingMode.HALF_UP);
            creditLender(b, lenderCut, now);
            creditAdmin(b, remaining.subtract(lenderCut), "COMMISSION", now);
        }
        if (lateFee.compareTo(BigDecimal.ZERO) > 0) {
            creditAdmin(b, lateFee, "LATE_FEE_REVENUE", now);
        }

        b.setCheckoutTime(now);
        b.setCheckoutStatus("COMPLETED");
        b.setBookingStatus("COMPLETED");
        b.setFinalAmt(estimated.add(lateFee));
        // additionalFee keeps the initial payment value — do NOT overwrite
        return bookingRepository.save(b);
    }

    // ── CANCEL ───────────────────────────────────────────────────────
    @Transactional
    public Booking cancelBooking(Long bookingId, String reason) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        if ("COMPLETED".equals(b.getCheckoutStatus())) throw new RuntimeException("Cannot cancel completed booking");
        if ("CANCELLED".equals(b.getBookingStatus()))  throw new RuntimeException("Already cancelled");

        LocalDateTime now = LocalDateTime.now();
        BigDecimal refund = b.getAdditionalFee() != null ? b.getAdditionalFee()
                : (b.getEstimatedAmt() != null ? b.getEstimatedAmt() : BigDecimal.ZERO);

        if (refund.compareTo(BigDecimal.ZERO) > 0) {
            walletRepository.findByUserUserId(b.getUser().getUserId()).ifPresent(w -> {
                w.setBalance(w.getBalance().add(refund));
                w.setLastUpdated(now);
                walletRepository.save(w);
                WalletTransaction tx = new WalletTransaction();
                tx.setWallet(w); tx.setBooking(b); tx.setAmount(refund);
                tx.setTransactionType("CREDIT"); tx.setPurpose("BOOKING_REFUND");
                tx.setTransactionStatus("SUCCESS"); tx.setTransactionTime(now);
                tx.setRefundReason(reason != null ? reason : "Cancelled by user");
                tx.setRefundProcessTime(now);
                transactionRepository.save(tx);
            });
            BigDecimal lenderDeduct = refund.multiply(LENDER_RATE).setScale(2, RoundingMode.HALF_UP);
            reverseLenderCredit(b, lenderDeduct, now);
            reverseAdminCredit(b, refund.subtract(lenderDeduct), now);
        }
        b.setBookingStatus("CANCELLED");
        b.setCheckoutStatus("CANCELLED");
        b.setCancellationReason(reason != null ? reason : "Cancelled by user");
        b.setCancellationTime(now);
        return bookingRepository.save(b);
    }

    // ── DYNAMIC PRICING ──────────────────────────────────────────────
    public BigDecimal getDynamicPrice(BigDecimal basePrice, int availableSlots, int totalSlots) {
        int    hour = LocalDateTime.now().getHour();
        int    day  = LocalDateTime.now().getDayOfWeek().getValue();
        double mult = 1.0;
        if      (hour >= 8  && hour <= 10) mult = 1.30;
        else if (hour >= 17 && hour <= 20) mult = 1.25;
        else if (hour >= 22 || hour <= 6)  mult = 0.80;
        if (day == 6 || day == 7) mult = (mult == 1.0) ? 1.15 : mult + 0.05;
        if (totalSlots > 0 && (double)(totalSlots - availableSlots) / totalSlots >= 0.8)
            mult = Math.min(mult + 0.10, 1.50);
        return basePrice.multiply(BigDecimal.valueOf(mult)).setScale(2, RoundingMode.HALF_UP);
    }

    public String getZoneType(String areaName) {
        if (areaName == null) return "ECONOMY";
        String a = areaName.toLowerCase();
        if (a.contains("t nagar")||a.contains("anna nagar")||a.contains("nungambakkam")||a.contains("velachery")||a.contains("adyar")||a.contains("mylapore")||a.contains("btm")||a.contains("koramangala")||a.contains("indiranagar")) return "PREMIUM";
        if (a.contains("guindy")||a.contains("perambur")||a.contains("madipakkam")||a.contains("tambaram")||a.contains("chrompet")||a.contains("electronic city")||a.contains("whitefield")) return "STANDARD";
        return "ECONOMY";
    }

    // ── HELPERS ──────────────────────────────────────────────────────
    private void creditLender(Booking b, BigDecimal amount, LocalDateTime now) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return;
        try {
            Long slotId = b.getSlot() != null ? b.getSlot().getSlotId() : null;
            if (slotId == null) return;
            ParkingSlot slot = parkingSlotRepository.findById(slotId).orElse(null);
            if (slot == null || slot.getSpot() == null || slot.getSpot().getUser() == null) return;
            walletRepository.findByUserUserId(slot.getSpot().getUser().getUserId()).ifPresent(w -> {
                w.setBalance(w.getBalance().add(amount)); w.setLastUpdated(now); walletRepository.save(w);
                saveTx(w, b, amount, "CREDIT", "SLOT_EARNING", now);
            });
        } catch (Exception e) { System.err.println("creditLender: " + e.getMessage()); }
    }

    private void creditAdmin(Booking b, BigDecimal amount, String purpose, LocalDateTime now) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) return;
        try {
            User adminUser = userRepository.findByRole("PARKING_ADMIN").stream().findFirst().orElse(null);
            if (adminUser == null) return;
            Wallet w = walletRepository.findByUserUserId(adminUser.getUserId()).orElse(null);
            if (w == null) { w = new Wallet(); w.setUser(adminUser); w.setBalance(BigDecimal.ZERO); w.setLastUpdated(now); w = walletRepository.save(w); }
            w.setBalance(w.getBalance().add(amount)); w.setLastUpdated(now); walletRepository.save(w);
            saveTx(w, b, amount, "CREDIT", purpose, now);
        } catch (Exception e) { System.err.println("creditAdmin: " + e.getMessage()); }
    }

    private void reverseLenderCredit(Booking b, BigDecimal amount, LocalDateTime now) {
        try {
            Long slotId = b.getSlot() != null ? b.getSlot().getSlotId() : null;
            if (slotId == null) return;
            ParkingSlot slot = parkingSlotRepository.findById(slotId).orElse(null);
            if (slot == null || slot.getSpot() == null || slot.getSpot().getUser() == null) return;
            walletRepository.findByUserUserId(slot.getSpot().getUser().getUserId()).ifPresent(w -> {
                w.setBalance(w.getBalance().subtract(amount).max(BigDecimal.ZERO)); w.setLastUpdated(now); walletRepository.save(w);
                saveTx(w, b, amount, "DEBIT", "BOOKING_REFUND_REVERSAL", now);
            });
        } catch (Exception e) { System.err.println("reverseLender: " + e.getMessage()); }
    }

    private void reverseAdminCredit(Booking b, BigDecimal amount, LocalDateTime now) {
        try {
            User adminUser = userRepository.findByRole("PARKING_ADMIN").stream().findFirst().orElse(null);
            if (adminUser == null) return;
            walletRepository.findByUserUserId(adminUser.getUserId()).ifPresent(w -> {
                w.setBalance(w.getBalance().subtract(amount).max(BigDecimal.ZERO)); w.setLastUpdated(now); walletRepository.save(w);
                saveTx(w, b, amount, "DEBIT", "COMMISSION_REVERSAL", now);
            });
        } catch (Exception e) { System.err.println("reverseAdmin: " + e.getMessage()); }
    }

    private void saveTx(Wallet w, Booking b, BigDecimal amt, String type, String purpose, LocalDateTime time) {
        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(w); tx.setBooking(b); tx.setAmount(amt);
        tx.setTransactionType(type); tx.setPurpose(purpose);
        tx.setTransactionStatus("SUCCESS"); tx.setTransactionTime(time);
        transactionRepository.save(tx);
    }
}