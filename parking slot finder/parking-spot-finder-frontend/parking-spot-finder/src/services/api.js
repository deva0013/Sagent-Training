const BASE_URL = 'http://localhost:8080';

const api = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) {
    const text = await res.text();
    let msg = `API error: ${res.status}`;
    try { msg = JSON.parse(text).error || msg; } catch {}
    throw new Error(msg);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
};

// ── Users ────────────────────────────────────────────────────────────
export const getUsers        = ()       => api('/users');
export const getUserById     = (id)     => api(`/users/${id}`);
export const createUser      = (user)   => api('/users', 'POST', user);
export const deleteUser      = (id)     => api(`/users/${id}`, 'DELETE');

// ── Locations ────────────────────────────────────────────────────────
export const getLocations    = ()       => api('/locations');
export const createLocation  = (loc)    => api('/locations', 'POST', loc);

// ── Parking Spots ────────────────────────────────────────────────────
export const getParkingSpots  = ()       => api('/spots');
export const createParkingSpot= (spot)   => api('/spots', 'POST', spot);
export const updateParkingSpot= (id, s)  => api(`/spots/${id}`, 'PUT', s);

// ── Parking Slots ────────────────────────────────────────────────────
export const getParkingSlots  = ()       => api('/slots');
export const createParkingSlot= (slot)   => api('/slots', 'POST', slot);
export const updateParkingSlot= (id, s)  => api(`/slots/${id}`, 'PUT', s);

// ── Vehicles ─────────────────────────────────────────────────────────
export const getVehicles      = ()       => api('/vehicles');
export const createVehicle    = (v)      => api('/vehicles', 'POST', v);

// ── Bookings ─────────────────────────────────────────────────────────
export const getBookings      = ()       => api('/bookings');
export const getBookingById   = (id)     => api(`/bookings/${id}`);
export const getMyBookings    = (userId) => api(`/bookings/user/${userId}`);
export const createBooking    = (b)      => api('/bookings', 'POST', b);
export const updateBooking    = (id, b)  => api(`/bookings/${id}`, 'PUT', b);

// Checkout — backend calculates late fee, deducts wallet, marks COMPLETED
export const checkoutBooking  = (id)     => api(`/bookings/${id}/checkout`, 'POST');

// Cancel — backend refunds initial payment, marks CANCELLED
export const cancelBooking    = (id, reason) =>
  api(`/bookings/${id}/cancel`, 'POST', { reason });

// Late fee preview — server tells us current fine before user confirms
export const getLateFee       = (id)     => api(`/bookings/${id}/late-fee`);

// ── Wallets ──────────────────────────────────────────────────────────
export const getWallets        = ()        => api('/wallets');
export const getWalletByUser   = (userId)  => api(`/wallets/user/${userId}`);
export const createWallet      = (w)       => api('/wallets', 'POST', w);
export const updateWallet      = (id, w)   => api(`/wallets/${id}`, 'PUT', w);
export const topUpWallet       = (id, amt) => api(`/wallets/${id}/topup`, 'POST', { amount: amt });

// ── Transactions ─────────────────────────────────────────────────────
export const getTransactions   = ()       => api('/transactions');
export const createTransaction = (tx)     => api('/transactions', 'POST', tx);
