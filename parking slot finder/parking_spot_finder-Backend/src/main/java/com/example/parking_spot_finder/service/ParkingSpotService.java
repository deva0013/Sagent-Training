package com.example.parking_spot_finder.service;



import com.example.parking_spot_finder.entity.ParkingSpot;
import com.example.parking_spot_finder.repository.ParkingSpotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ParkingSpotService {

    @Autowired
    private ParkingSpotRepository parkingSpotRepository;

    public ParkingSpot saveParkingSpot(ParkingSpot spot) {
        return parkingSpotRepository.save(spot);
    }

    public List<ParkingSpot> getAllSpots() {
        return parkingSpotRepository.findAll();
    }
}