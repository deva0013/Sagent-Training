package com.example.parking_spot_finder.controller;

import com.example.parking_spot_finder.entity.ParkingSpot;
import com.example.parking_spot_finder.service.ParkingSpotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/spots")
public class ParkingSpotController {

    @Autowired
    private ParkingSpotService parkingSpotService;

    @PostMapping
    public ParkingSpot addSpot(@RequestBody ParkingSpot spot) {
        return parkingSpotService.saveParkingSpot(spot);
    }

    @GetMapping
    public List<ParkingSpot> getAllSpots() {
        return parkingSpotService.getAllSpots();
    }


    @PutMapping("/{id}")
    public ResponseEntity<ParkingSpot> updateSpot(
            @PathVariable Long id,
            @RequestBody ParkingSpot spot) {
        spot.setSpotId(id);
        return ResponseEntity.ok(parkingSpotService.saveParkingSpot(spot));
    }

}