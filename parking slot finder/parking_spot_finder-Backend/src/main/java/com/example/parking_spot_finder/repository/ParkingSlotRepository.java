package com.example.parking_spot_finder.repository;

import com.example.parking_spot_finder.entity.ParkingSlot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
}
