package com.example.parking_spot_finder.repository;

import com.example.parking_spot_finder.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}
