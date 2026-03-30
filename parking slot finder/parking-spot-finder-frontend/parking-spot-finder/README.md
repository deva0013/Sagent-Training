# ParkEase – Parking Spot Finder Frontend

A full-featured React frontend for the Parking Spot Finder Spring Boot backend.

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 16+
- Your Spring Boot backend running on `http://localhost:8080`

### Install & Start

```bash
npm install
npm start
```

App opens at `http://localhost:3000`

---

## 🔗 Backend CORS Configuration

Add this to your Spring Boot main application class or a config file:

```java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                    .allowedOrigins("http://localhost:3000")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*");
        }
    };
}
```

---

## 👤 User Roles & Features

### USER
- Register / Login
- 🔍 Search & filter available parking spots
- 📅 Book a parking slot (creates HOLD → CONFIRMED)
- 📋 View booking history with status & amounts
- 🚗 Add & manage vehicles
- 💰 Wallet balance & transaction history

### SPOT_LENDER
- Register / Login
- 🏢 Submit parking spots (enters PENDING state)
- ➕ Add parking slots to each spot
- 📊 Track spot approval status
- 📋 View bookings made on their spots

### PARKING_ADMIN
- Dashboard with system-wide stats
- ✅ Approve or Reject submitted parking spots
- 👥 View & delete users
- 📋 View all bookings with filters
- 📍 Add & manage location zones

---

## 📡 API Endpoints Used

| Method | Endpoint        | Description             |
|--------|----------------|-------------------------|
| GET    | /users          | Get all users           |
| POST   | /users          | Create user             |
| DELETE | /users/{id}     | Delete user             |
| GET    | /locations      | Get all locations       |
| POST   | /locations      | Add location            |
| GET    | /spots          | Get all parking spots   |
| POST   | /spots          | Create parking spot     |
| GET    | /slots          | Get all parking slots   |
| POST   | /slots          | Add parking slot        |
| GET    | /vehicles       | Get all vehicles        |
| POST   | /vehicles       | Add vehicle             |
| GET    | /bookings       | Get all bookings        |
| POST   | /bookings       | Create booking          |
| GET    | /wallets        | Get all wallets         |
| POST   | /wallets        | Create wallet           |
| GET    | /transactions   | Get all transactions    |
| POST   | /transactions   | Add transaction         |

---

## 💡 Recommended Backend Additions

To fully support the admin approve/reject flow, add these endpoints to your Spring Boot app:

```java
// In ParkingSpotController.java
@PutMapping("/{id}")
public ParkingSpot updateSpot(@PathVariable Long id, @RequestBody ParkingSpot spot) {
    spot.setSpotId(id);
    return parkingSpotService.saveParkingSpot(spot);
}

// In ParkingSlotController.java
@PutMapping("/{id}")
public ParkingSlot updateSlot(@PathVariable Long id, @RequestBody ParkingSlot slot) {
    slot.setSlotId(id);
    return parkingSlotService.saveSlot(slot);
}
```

---

## 🏗️ Project Structure

```
src/
├── context/
│   └── AuthContext.js       # Login state (persists in localStorage)
├── services/
│   └── api.js               # All API calls to backend
├── components/
│   └── Navbar.js            # Role-aware navigation
├── pages/
│   ├── LoginPage.js         # Login & Register
│   ├── Dashboard.js         # Role-based dashboard
│   ├── SearchPage.js        # Find & book parking
│   ├── MyBookingsPage.js    # User booking history
│   ├── VehiclesPage.js      # Manage vehicles
│   ├── WalletPage.js        # Wallet & transactions
│   ├── MySpots.js           # Lender spot management
│   ├── LenderBookings.js    # Lender booking tracker
│   ├── AdminSpots.js        # Admin approve/reject
│   ├── AdminUsers.js        # Admin user management
│   ├── AdminBookings.js     # Admin all bookings
│   └── AdminLocations.js    # Admin location zones
├── App.js                   # Router + protected routes
├── index.js                 # Entry point
└── index.css                # Global design system
```
