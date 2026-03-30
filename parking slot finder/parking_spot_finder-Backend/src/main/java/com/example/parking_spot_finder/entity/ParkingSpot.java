package com.example.parking_spot_finder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_spot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSpot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long spotId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    private String spotName;

    private String address;

    @Column(nullable = false)
    private BigDecimal pricePerHr;

    private String approvalStatus;
    private String approvalReason;
    private LocalDateTime approvalTime;

    // Exact GPS coordinates for this parking spot (for navigation)
    private Double latitude;
    private Double longitude;
}
