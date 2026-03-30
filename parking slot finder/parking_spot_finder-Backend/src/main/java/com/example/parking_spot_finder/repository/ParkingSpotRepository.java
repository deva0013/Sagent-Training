package com.example.parking_spot_finder.repository;

import com.example.parking_spot_finder.entity.ParkingSpot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParkingSpotRepository extends JpaRepository<ParkingSpot, Long> {
}
