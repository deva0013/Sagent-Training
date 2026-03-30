import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getParkingSpots, getParkingSlots, getVehicles,
  createBooking, getWallets, getBookings
} from '../services/api';
import { useAuth } from '../context/AuthContext';
 
// ── ZONE LABEL (matches backend getZoneType) ──────────────────────────
const getZoneLabel = (areaName) => {
  if (!areaName) return null;
  const area = areaName.toLowerCase();
  if (['t nagar','anna nagar','nungambakkam','velachery','adyar','mylapore','btm','koramangala','indiranagar'].some(z => area.includes(z)))
    return { label: 'Premium Zone', color: '#7c3aed', bg: '#ede9fe' };
  if (['guindy','perambur','madipakkam','tambaram','chrompet','electronic city','whitefield'].some(z => area.includes(z)))
    return { label: 'Standard Zone', color: '#0891b2', bg: '#cffafe' };
  return { label: 'Economy Zone', color: '#16a34a', bg: '#dcfce7' };
};
 
// ── DYNAMIC PRICING (matches backend getDynamicPrice) ─────────────────
const getDynamicPrice = (basePrice, availableSlots, totalSlots) => {
  const now  = new Date();
  const hour = now.getHours();
  const day  = now.getDay(); // 0=Sun, 6=Sat
  let multiplier = 1.0;
  let reason = '';
 
  if      (hour >= 8  && hour <= 10) { multiplier = 1.30; reason = '🌅 Morning peak'; }
  else if (hour >= 17 && hour <= 20) { multiplier = 1.25; reason = '🌆 Evening peak'; }
  else if (hour >= 22 || hour <= 6)  { multiplier = 0.80; reason = '🌙 Late night discount'; }
 
  if (day === 0 || day === 6) {
    if (multiplier === 1.0) { multiplier = 1.15; reason = '📅 Weekend'; }
    else                    { multiplier += 0.05; reason += ' · Weekend'; }
  }
 
  const occupancyRate = totalSlots > 0 ? (totalSlots - availableSlots) / totalSlots : 0;
  if (occupancyRate >= 0.8 && multiplier === 1.0) { multiplier = 1.2; reason = '🔥 High demand'; }
  else if (occupancyRate >= 0.8)                  { multiplier += 0.1; }
 
  multiplier = Math.min(multiplier, 1.5);
  return {
    dynamicPrice: parseFloat((basePrice * multiplier).toFixed(0)),
    multiplier, reason,
    isPeak:    multiplier > 1.0,
    isDiscount: multiplier < 1.0,
  };
};
 
// ── GOOGLE MAPS NAVIGATION ────────────────────────────────────────────
// Uses actual GPS coords from ParkingSpot entity (latitude/longitude fields)
const navigateToSpot = (spot, userLoc) => {
  const destLat = parseFloat(spot.latitude  || spot.location?.latitude);
  const destLng = parseFloat(spot.longitude || spot.location?.longitude);
 
  if (destLat && destLng && !isNaN(destLat) && !isNaN(destLng)) {
    // Build URL with origin (user location) + destination (spot coordinates)
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    if (userLoc?.lat && userLoc?.lng) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${destLat},${destLng}&travelmode=driving`;
    }
    window.open(url, '_blank');
  } else {
    // Fallback: search by name/address
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${spot.spotName} ${spot.address}`)}`, '_blank');
  }
};
 
const parseLocal = (dtStr) => {
  if (!dtStr) return null;
  if (dtStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dtStr)) return new Date(dtStr);
  return new Date(dtStr.replace(' ', 'T').replace(/\.\d+$/, '') + '+05:30');
};
 
const HOLD_EXPIRY_MINUTES = 10;
 
const getDynamicSlotStatus = (slotId, allBookings, reqStart, reqEnd) => {
  const now = new Date();
 
  const activeBlock = allBookings.find(b => {
    if (b.slot?.slotId !== slotId) return false;
    if (b.bookingStatus !== 'BLOCKED' || b.checkoutStatus === 'CANCELLED') return false;
    const bStart = parseLocal(b.startTime);
    const bEnd   = parseLocal(b.endTime);
    if (!bStart || !bEnd) return false;
    if (reqStart && reqEnd) return reqStart < bEnd && reqEnd > bStart;
    return now >= bStart && now <= bEnd;
  });
  if (activeBlock) return { status: 'BLOCKED', booking: activeBlock };
 
  const activeBookings = allBookings.filter(b => {
    if (b.slot?.slotId !== slotId) return false;
    if (['BLOCKED','CANCELLED','COMPLETED'].includes(b.bookingStatus)) return false;
    if (['COMPLETED','CANCELLED'].includes(b.checkoutStatus)) return false;
    return true;
  });
 
  for (const b of activeBookings) {
    const bEnd = parseLocal(b.endTime);
    if (bEnd && now > bEnd) continue;
 
    if (b.bookingStatus === 'HOLD') {
      const created = parseLocal(b.startTime);
      if (created && (now - created) / 60000 > HOLD_EXPIRY_MINUTES) continue;
      if (reqStart && reqEnd) {
        const bStart = parseLocal(b.startTime);
        if (bStart && bEnd && reqStart < bEnd && reqEnd > bStart) return { status: 'HOLD', booking: b };
      } else return { status: 'HOLD', booking: b };
    }
 
    if (b.bookingStatus === 'CONFIRMED') {
      if (reqStart && reqEnd) {
        const bStart = parseLocal(b.startTime);
        if (bStart && bEnd && reqStart < bEnd && reqEnd > bStart) return { status: 'RESERVED', booking: b };
      } else return { status: 'RESERVED', booking: b };
    }
  }
  return { status: 'AVAILABLE', booking: null };
};
 
export default function SearchPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots]             = useState([]);
  const [slots, setSlots]             = useState([]);
  const [vehicles, setVehicles]       = useState([]);
  const [myWallet, setMyWallet]       = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [search, setSearch]           = useState('');
  const [maxPrice, setMaxPrice]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookingModal, setBookingModal] = useState(null);
  const [bookForm, setBookForm]       = useState({ vehicleId: '', startTime: '', endTime: '', slotId: '' });
  const [booking, setBooking]         = useState(false);
  const [success, setSuccess]         = useState('');
  const [error, setError]             = useState('');
  const [holdTimer, setHoldTimer]     = useState(null);
  const [holdSeconds, setHoldSeconds] = useState(600);
  const [holdExpired, setHoldExpired] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating]       = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
 
  const load = useCallback(async () => {
    try {
      const [s, sl, v, w, b] = await Promise.all([
        getParkingSpots(), getParkingSlots(), getVehicles(), getWallets(), getBookings()
      ]);
      setAllBookings(b || []);
      setSpots(s.filter(sp => sp.approvalStatus === 'APPROVED'));
      setSlots(sl);
      setVehicles(currentUser ? v.filter(vv => vv.user?.userId === currentUser.userId) : []);
      if (currentUser) setMyWallet(w.find(ww => ww.user?.userId === currentUser.userId) || null);
    } catch {}
    setLoading(false);
  }, [currentUser]);
 
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  useEffect(() => () => { if (holdTimer) clearInterval(holdTimer); }, [holdTimer]);
 
  const getSpotSlots    = (spotId) => slots.filter(sl => sl.spot?.spotId === spotId);
  const getSlotStatus   = (slotId) => {
    const reqStart = bookForm.startTime ? parseLocal(bookForm.startTime + ':00') : null;
    const reqEnd   = bookForm.endTime   ? parseLocal(bookForm.endTime   + ':00') : null;
    return getDynamicSlotStatus(slotId, allBookings, reqStart, reqEnd);
  };
  const getAvailableSlots = (spotId) =>
    slots.filter(sl => sl.spot?.spotId === spotId && getSlotStatus(sl.slotId).status === 'AVAILABLE');
 
  // ── GEOLOCATION ───────────────────────────────────────────────────
  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };
  const requestLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortByDistance(true);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) alert('Location access denied. Please allow location in browser settings.');
        else alert('Could not get your location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
 
  // Get spot GPS coords (from spot.latitude/longitude or location nested object)
  const getSpotCoords = (spot) => {
    const lat = parseFloat(spot.latitude  || spot.location?.latitude);
    const lng = parseFloat(spot.longitude || spot.location?.longitude);
    return (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) ? { lat, lng } : null;
  };
  const getSpotDistance = (spot) => {
    if (!userLocation) return null;
    const coords = getSpotCoords(spot);
    if (!coords) return null;
    return getDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
  };
 
  const filtered = spots.filter(sp => {
    const loc = sp.location;
    const matchSearch = !search ||
      sp.spotName?.toLowerCase().includes(search.toLowerCase()) ||
      sp.address?.toLowerCase().includes(search.toLowerCase()) ||
      loc?.areaName?.toLowerCase().includes(search.toLowerCase()) ||
      loc?.city?.toLowerCase().includes(search.toLowerCase());
    const matchPrice = !maxPrice || parseFloat(sp.pricePerHr) <= parseFloat(maxPrice);
    return matchSearch && matchPrice;
  }).sort((a, b) => {
    if (!sortByDistance || !userLocation) return 0;
    return (getSpotDistance(a) ?? 9999) - (getSpotDistance(b) ?? 9999);
  });
 
  const slotStatusUI = (status) => ({
    'AVAILABLE': { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.35)', color: '#166534', icon: '🟢', label: 'AVAILABLE', tapLabel: 'tap to book' },
    'HOLD':      { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)',  color: '#92400e', icon: '⏳', label: 'HOLD',      tapLabel: 'expiring soon' },
    'RESERVED':  { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.35)', color: '#1e40af', icon: '🔵', label: 'RESERVED',  tapLabel: 'not available' },
    'BLOCKED':   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.4)',  color: '#92400e', icon: '🔒', label: 'BLOCKED',   tapLabel: 'unavailable' },
  }[status] || { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', color: '#991b1b', icon: '🔴', label: status, tapLabel: 'not available' });
 
  const startHoldTimer = () => {
    setHoldSeconds(600); setHoldExpired(false);
    if (holdTimer) clearInterval(holdTimer);
    const timer = setInterval(() => setHoldSeconds(prev => {
      if (prev <= 1) { clearInterval(timer); setHoldExpired(true); setBookingModal(null); setError('Hold expired. Please select again.'); return 0; }
      return prev - 1;
    }), 1000);
    setHoldTimer(timer);
  };
 
  const openBookingModal = (spot, slot) => {
    if (!currentUser) { navigate('/login'); return; }
    const now   = new Date();
    const start = now.toISOString().slice(0, 16);
    const end   = new Date(now.getTime() + 2 * 3600000).toISOString().slice(0, 16);
    setBookForm({ vehicleId: '', startTime: start, endTime: end, slotId: slot.slotId });
    setBookingModal({ spot, slot });
    setError('');
    startHoldTimer();
  };
 
  const cancelBookingModal = () => {
    setBookingModal(null);
    if (holdTimer) clearInterval(holdTimer);
    setHoldTimer(null); setHoldSeconds(600);
  };
 
  const formatTimer = (secs) =>
    `${Math.floor(secs/60).toString().padStart(2,'0')}:${(secs%60).toString().padStart(2,'0')}`;
 
  const getEffectivePrice = (spot) => {
    if (!spot) return 0;
    const total = slots.filter(sl => sl.spot?.spotId === spot.spotId).length;
    const avail = getAvailableSlots(spot.spotId).length;
    return getDynamicPrice(parseFloat(spot.pricePerHr), avail, total).dynamicPrice;
  };
 
  const getTotalEstimate = () => {
    if (!bookForm.startTime || !bookForm.endTime || !bookingModal) return 0;
    const dur = (new Date(bookForm.endTime) - new Date(bookForm.startTime)) / 3600000;
    return dur <= 0 ? 0 : parseFloat((dur * getEffectivePrice(bookingModal.spot)).toFixed(2));
  };
 
  // ── CONFIRM BOOKING ───────────────────────────────────────────────
  // Backend (BookingService.createBookingWithPayment) handles:
  //   1. Deduct initial payment from user wallet
  //   2. Credit 90% to lender wallet
  //   3. Credit 10% to admin wallet
  //   4. Record all transactions atomically
  const confirmBooking = async () => {
    if (!bookForm.vehicleId)           { setError('Please select a vehicle'); return; }
    if (holdExpired)                   { setError('Hold expired. Please try again.'); return; }
    if (!bookForm.startTime || !bookForm.endTime) { setError('Please set start and end time'); return; }
    const duration = (new Date(bookForm.endTime) - new Date(bookForm.startTime)) / 3600000;
    if (duration <= 0)                 { setError('End time must be after start time'); return; }
 
    const totalEstimate  = getTotalEstimate();
    const initialPayment = getEffectivePrice(bookingModal.spot); // 1 hr initial
 
    if (!myWallet) { setError('You need a wallet to book. Go to Wallet page and create one.'); return; }
    if (parseFloat(myWallet.balance || 0) < initialPayment) {
      setError(`Insufficient balance. Need ₹${initialPayment.toFixed(2)}, have ₹${parseFloat(myWallet.balance || 0).toFixed(2)}`);
      return;
    }
 
    setBooking(true); setError('');
    try {
      const code = 'BK' + Date.now().toString().slice(-6);
 
      // Single POST — backend does everything (deduct user, credit lender 90%, credit admin 10%)
      await createBooking({
        user:          { userId: currentUser.userId },
        slot:          { slotId: bookForm.slotId },
        vehicle:       { vehicleId: parseInt(bookForm.vehicleId) },
        bookingDate:   new Date().toISOString().slice(0, 10),
        startTime:     bookForm.startTime + ':00',
        endTime:       bookForm.endTime   + ':00',
        bookingStatus: 'CONFIRMED',
        bookingCode:   code,
        estimatedAmt:  totalEstimate.toFixed(2),
        additionalFee: initialPayment.toFixed(2), // initial payment amount
        finalAmt:      totalEstimate.toFixed(2),
        checkoutStatus: 'PENDING',
      });
 
      if (holdTimer) clearInterval(holdTimer);
      setSuccess(`🎉 Booking confirmed! Code: ${code} | ₹${initialPayment.toFixed(2)} paid. Slot is RESERVED.`);
      setBookingModal(null);
      setSelectedSpot(null);
      load();
    } catch (e) {
      setError(e?.message || 'Booking failed. Check if backend is running.');
    }
    setBooking(false);
  };
 
  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;
 
  const initialPayment      = bookingModal ? getEffectivePrice(bookingModal.spot) : 0;
  const totalEstimate       = getTotalEstimate();
  const remainingAtCheckout = Math.max(0, totalEstimate - initialPayment);
 
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Find Parking</h1>
        <p>Search available parking spots near you</p>
      </div>
 
      {success && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {error && !bookingModal && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}
 
      {/* Wallet balance strip */}
      {currentUser?.role === 'USER' && myWallet && (
        <div style={{ background: '#fff', border: '1px solid #e2e5f0', borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>💰 Wallet Balance</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem' }}>₹{parseFloat(myWallet.balance || 0).toFixed(2)}</span>
        </div>
      )}
 
      {/* Dynamic Pricing Banner */}
      {(() => {
        const h = new Date().getHours(), d = new Date().getDay();
        const isMorning = h >= 8 && h <= 10, isEvening = h >= 17 && h <= 20;
        const isNight = h >= 22 || h <= 6, isWeekend = d === 0 || d === 6;
        if (!isMorning && !isEvening && !isNight && !isWeekend) return null;
        const msg = isMorning ? { text: '🌅 Morning peak — prices +30% until 10 AM', bg: '#fef3c7', border: '#fde68a', color: '#92400e' }
                  : isEvening ? { text: '🌆 Evening peak — prices +25% until 8 PM',  bg: '#fef3c7', border: '#fde68a', color: '#92400e' }
                  : isNight   ? { text: '🌙 Late night — enjoy 20% discount!',         bg: '#dcfce7', border: '#bbf7d0', color: '#166534' }
                  :             { text: '📅 Weekend pricing — +15% on all spots',       bg: '#ede9fe', border: '#c4b5fd', color: '#4f46e5' };
        return <div style={{ background: msg.bg, border: `1px solid ${msg.border}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, color: msg.color }}>{msg.text}</div>;
      })()}
 
      {/* Search Bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e5f0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'flex-end', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
        <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
          <label>Search by area, city or spot name</label>
          <input placeholder="e.g. Guindy, Chennai..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
          <label>Max Price / Hour (₹)</label>
          <input type="number" placeholder="Any price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={() => { setSearch(''); setMaxPrice(''); setSelectedSpot(null); }}>Clear</button>
        <button onClick={requestLocation} disabled={locating} style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #4f46e5', background: sortByDistance ? '#4f46e5' : '#fff', color: sortByDistance ? '#fff' : '#4f46e5', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {locating ? '⏳ Locating...' : sortByDistance ? '📍 Sorted by distance' : '📍 Find Nearby'}
        </button>
        {sortByDistance && (
          <button onClick={() => { setSortByDistance(false); setUserLocation(null); }} style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e5f0', background: '#fff', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>✕ Clear</button>
        )}
      </div>
 
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '13px' }}>{filtered.length} spot{filtered.length !== 1 ? 's' : ''} found</p>
 
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">🔍</div><p>No spots found. Try a different search.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map(spot => {
            const allSpotSlots = getSpotSlots(spot.spotId);
            const availSlots   = getAvailableSlots(spot.spotId);
            const isExpanded   = selectedSpot === spot.spotId;
            const dp   = getDynamicPrice(parseFloat(spot.pricePerHr), availSlots.length, allSpotSlots.length);
            const zone = getZoneLabel(spot.location?.areaName);
            const dist = getSpotDistance(spot);
            const isPriceChanged = dp.dynamicPrice !== parseFloat(spot.pricePerHr);
 
            return (
              <div key={spot.spotId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Spot header */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'transparent' }}
                  onClick={() => setSelectedSpot(isExpanded ? null : spot.spotId)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', color: '#0f172a' }}>{spot.spotName}</h3>
                      <span className="badge badge-success">ACTIVE</span>
                      {zone && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: zone.bg, color: zone.color }}>{zone.label}</span>}
                      {dp.reason && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: dp.isPeak ? '#fef3c7' : '#dcfce7', color: dp.isPeak ? '#92400e' : '#166534' }}>{dp.reason}</span>}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>📍 {spot.address}{spot.location && ` · ${spot.location.areaName}, ${spot.location.city}`}</span>
                      {dist !== null && <span style={{ background: '#ede9fe', color: '#4f46e5', fontWeight: 700, fontSize: '10px', padding: '2px 8px', borderRadius: '20px' }}>📍 {dist < 1 ? `${(dist*1000).toFixed(0)}m` : `${dist.toFixed(1)}km`} away</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', minWidth: '64px' }}>
                      {isPriceChanged ? (
                        <>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: dp.isPeak ? '#ef4444' : '#10b981', fontSize: '1.1rem' }}>₹{dp.dynamicPrice}</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{spot.pricePerHr}</div>
                          <div style={{ fontSize: '9px', color: dp.isPeak ? '#ef4444' : '#10b981', fontWeight: 600 }}>{dp.isPeak ? `+${Math.round((dp.multiplier-1)*100)}%` : `-${Math.round((1-dp.multiplier)*100)}%`}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem' }}>₹{spot.pricePerHr}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>per hour</div>
                        </>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: availSlots.length > 0 ? '#10b981' : '#ef4444' }}>{availSlots.length}/{allSpotSlots.length}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>available</div>
                    </div>
                    <button onClick={e => {
                      e.stopPropagation();
                      const coords = getSpotCoords(spot);
                      if (coords) {
                        let url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&travelmode=driving`;
                        if (userLocation) url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${coords.lat},${coords.lng}&travelmode=driving`;
                        window.open(url, '_blank');
                      } else {
                        window.open(`https://www.google.com/maps/search/${encodeURIComponent(spot.spotName + ' ' + spot.address)}`, '_blank');
                      }
                    }}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #e2e5f0', background: '#fff', color: '#4f46e5', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#ede9fe'; e.currentTarget.style.borderColor='#4f46e5'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e2e5f0'; }}>
                      🗺️ Nav
                    </button>
                    <div style={{ fontSize: '18px', color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  </div>
                </div>
 
                {/* Slot grid */}
                {isExpanded && (
                  <div style={{ padding: '0 24px 24px', borderTop: '1px solid #e2e5f0' }}>
                    <div style={{ paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
                        Slots — {allSpotSlots.length} total · Click a green slot to book
                      </h4>
                      {allSpotSlots.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>No slots configured yet.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                          {allSpotSlots.map(sl => {
                            const { status } = getSlotStatus(sl.slotId);
                            const ui = slotStatusUI(status);
                            const isAvail = status === 'AVAILABLE';
                            return (
                              <div key={sl.slotId}
                                onClick={() => isAvail && currentUser?.role === 'USER' && openBookingModal(spot, sl)}
                                style={{ background: ui.bg, border: `1.5px solid ${ui.border}`, borderRadius: '12px', padding: '16px 10px', textAlign: 'center', cursor: isAvail && currentUser?.role === 'USER' ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                                onMouseEnter={e => { if (isAvail && currentUser?.role === 'USER') e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{ui.icon}</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: ui.color }}>#{sl.slotNo}</div>
                                <div style={{ fontSize: '10px', color: ui.color, marginTop: '3px', textTransform: 'uppercase' }}>{ui.label}</div>
                                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px' }}>{ui.tapLabel}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
                        {[['🟢','Available','#166634'],['⏳','Hold (10 min)','#92400e'],['🔵','Reserved','#1e40af'],['🔒','Blocked by lender','#92400e']].map(([icon, label, color]) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                            <span style={{ fontSize: '12px' }}>{icon}</span><span style={{ color }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
 
      {/* BOOKING MODAL */}
      {bookingModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) cancelBookingModal(); }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            {/* Hold Timer */}
            <div style={{ background: holdSeconds <= 60 ? '#fee2e2' : '#ede9fe', border: `1px solid ${holdSeconds <= 60 ? '#fca5a5' : '#c4b5fd'}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: holdSeconds <= 60 ? '#991b1b' : '#4f46e5', fontWeight: 700, textTransform: 'uppercase' }}>Slot Hold Timer</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{holdSeconds <= 60 ? 'Hurry! Slot will be released soon' : 'Complete booking before slot is released'}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: holdSeconds <= 60 ? '#ef4444' : holdSeconds <= 120 ? '#f59e0b' : '#4f46e5' }}>{formatTimer(holdSeconds)}</div>
            </div>
 
            <h2 style={{ marginBottom: '6px' }}>Book Parking Slot</h2>
 
            {/* Spot Info */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #e2e5f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{bookingModal.spot.spotName}</div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{bookingModal.spot.address}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>₹{bookingModal.spot.pricePerHr}/hr</div>
                  <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>Slot #{bookingModal.slot.slotNo}</div>
                </div>
              </div>
            </div>
 
            {myWallet && (
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e5f0' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>💰 Wallet Balance</span>
                <span style={{ fontWeight: 700, color: parseFloat(myWallet.balance || 0) >= initialPayment ? '#10b981' : '#ef4444' }}>₹{parseFloat(myWallet.balance || 0).toFixed(2)}</span>
              </div>
            )}
            {!myWallet && <div className="alert alert-error" style={{ marginBottom: '14px' }}>No wallet found. Create one from Wallet page first.</div>}
            {error && <div className="alert alert-error">{error}</div>}
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Your Vehicle</label>
                <select value={bookForm.vehicleId} onChange={e => setBookForm(p => ({ ...p, vehicleId: e.target.value }))}>
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.vehicleNo}</option>)}
                </select>
                {vehicles.length === 0 && <span style={{ fontSize: '11px', color: '#f59e0b' }}>No vehicles. Add one from Vehicles page.</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="datetime-local" value={bookForm.startTime} onChange={e => setBookForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="datetime-local" value={bookForm.endTime} onChange={e => setBookForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
 
              {bookForm.startTime && bookForm.endTime && new Date(bookForm.endTime) > new Date(bookForm.startTime) && (
                <div style={{ border: '1px solid #e2e5f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e5f0', background: '#f8fafc' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Duration × rate</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {((new Date(bookForm.endTime) - new Date(bookForm.startTime)) / 3600000).toFixed(1)} hrs × ₹{bookingModal.spot.pricePerHr} = ₹{totalEstimate.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e5f0', background: '#fffbeb' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>Pay Now (1 hr initial)</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Slot becomes RESERVED immediately</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#f59e0b', fontSize: '1.1rem' }}>₹{initialPayment.toFixed(2)}</span>
                  </div>
                  <div style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', background: '#eff6ff' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>Pay at Checkout</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>Remaining + any late fees</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#4f46e5', fontSize: '1.1rem' }}>₹{remainingAtCheckout.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
 
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={cancelBookingModal}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmBooking} disabled={booking || holdExpired || !myWallet}>
                {booking ? 'Processing...' : `Pay ₹${initialPayment.toFixed(2)} & Reserve Slot →`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}