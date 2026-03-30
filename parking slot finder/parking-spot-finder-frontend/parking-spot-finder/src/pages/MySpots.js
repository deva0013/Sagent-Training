import React, { useEffect, useState } from 'react';
import {
  getParkingSpots, createParkingSpot, getLocations,
  getParkingSlots, createParkingSlot, getBookings, createBooking
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const parseLocal = (dtStr) => {
  if (!dtStr) return null;
  const hasTimezone = dtStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dtStr);
  if (hasTimezone) return new Date(dtStr);
  return new Date(dtStr + '+05:30');
};

/*
  DYNAMIC SLOT STATUS — derived from real bookings, not stored slot.status
  ─────────────────────────────────────────────────────────────────────────
  RESERVED  → slot has an active booking (HOLD or CONFIRMED, not checked out)
  BLOCKED   → lender has blocked this time
  AVAILABLE → no active booking, no active block
*/
const getDynamicStatus = (slotId, allBookings) => {
  const now = new Date();

  const activeBooking = allBookings.find(b => {
    if (b.slot?.slotId !== slotId) return false;
    if (b.bookingStatus === 'BLOCKED') return false;       // blocks handled separately
    if (b.bookingStatus === 'CANCELLED') return false;
    if (b.bookingStatus === 'COMPLETED') return false;
    if (b.checkoutStatus === 'COMPLETED') return false;
    if (b.checkoutStatus === 'CANCELLED') return false;
    // HOLD or CONFIRMED with end time in future (or no end time)
    const end = parseLocal(b.endTime);
    return !end || end > now;
  });

  if (activeBooking) {
    return {
      status: activeBooking.bookingStatus === 'HOLD' ? 'HOLD' : 'RESERVED',
      booking: activeBooking,
    };
  }

  const activeBlock = allBookings.find(b => {
    if (b.slot?.slotId !== slotId) return false;
    if (b.bookingStatus !== 'BLOCKED') return false;
    if (b.checkoutStatus === 'CANCELLED') return false;
    const start = parseLocal(b.startTime);
    const end   = parseLocal(b.endTime);
    return start && end && now >= start && now <= end;
  });

  if (activeBlock) return { status: 'BLOCKED', booking: activeBlock };

  return { status: 'AVAILABLE', booking: null };
};

export default function MySpots() {
  const { currentUser } = useAuth();
  const [spots, setSpots]         = useState([]);
  const [locations, setLocations] = useState([]);
  const [slots, setSlots]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const [showSpotModal, setShowSpotModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(null);
  const [blockModal, setBlockModal]       = useState(null);

  const [spotForm, setSpotForm] = useState({ spotName: '', address: '', pricePerHr: '', locationId: '' });
  const [slotForm, setSlotForm] = useState({ slotNo: '' });
  const [blockForm, setBlockForm] = useState({ date: '', fromTime: '', toTime: '', reason: '' });

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const [s, l, sl, b] = await Promise.all([
        getParkingSpots(), getLocations(), getParkingSlots(), getBookings()
      ]);
      setSpots(s.filter(sp => sp.user?.userId === currentUser.userId));
      setLocations(l);
      setSlots(sl);

      // Auto-remove expired blocks silently
      const now = new Date();
      const expiredBlocks = b.filter(bk => {
        if (bk.bookingStatus !== 'BLOCKED') return false;
        if (bk.checkoutStatus === 'CANCELLED') return false;
        const bEnd = bk.endTime ? new Date(bk.endTime) : null;
        return bEnd && now > bEnd;
      });
      await Promise.all(expiredBlocks.map(bk =>
        fetch(`http://localhost:8080/bookings/${bk.bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutStatus: 'CANCELLED', bookingStatus: 'CANCELLED' }),
        }).catch(() => {})
      ));

      // Reload bookings if any expired blocks were cleaned up
      const freshB = expiredBlocks.length > 0 ? await getBookings() : b;
      setBookings(freshB);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser]);

  // Auto-refresh every 60 seconds so status updates live
  useEffect(() => {
    const t = setInterval(() => load(), 60000);
    return () => clearInterval(t);
  }, [currentUser]);

  const getSlots = (spotId) => slots.filter(s => s.spot?.spotId === spotId);

  const getBlocks = (slotId) => {
    const now = new Date();
    return bookings.filter(b => {
      if (b.slot?.slotId !== slotId) return false;
      if (b.bookingStatus !== 'BLOCKED') return false;
      if (b.checkoutStatus === 'CANCELLED') return false;
      // Hide expired blocks (end time already passed)
      const bEnd = b.endTime ? new Date(b.endTime) : null;
      if (bEnd && now > bEnd) return false;
      return true;
    });
  };

  const spotStatusColor = (s) => {
    if (s === 'APPROVED') return 'success';
    if (s === 'PENDING')  return 'warning';
    if (s === 'REJECTED') return 'danger';
    return 'neutral';
  };

  const slotStatusStyle = (status) => {
    switch (status) {
      case 'AVAILABLE': return { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', icon: '🟢', label: 'AVAILABLE' };
      case 'HOLD':      return { bg: '#fff7ed', border: '#fed7aa', color: '#92400e', icon: '⏳', label: 'HOLD (10 min)' };
      case 'RESERVED':  return { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: '🔵', label: 'RESERVED' };
      case 'BLOCKED':   return { bg: '#fff7ed', border: '#fcd34d', color: '#92400e', icon: '🔒', label: 'BLOCKED' };
      default:          return { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '🔴', label: status };
    }
  };

  const handleAddSpot = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createParkingSpot({
        spotName: spotForm.spotName, address: spotForm.address,
        pricePerHr: spotForm.pricePerHr, approvalStatus: 'PENDING',
        user: { userId: currentUser.userId },
        location: { locationId: parseInt(spotForm.locationId) },
      });
      setSuccess('Spot submitted for approval!');
      setShowSpotModal(false);
      setSpotForm({ spotName: '', address: '', pricePerHr: '', locationId: '' });
      load();
    } catch { setError('Failed to add spot.'); }
    setSaving(false);
  };

  const handleAddSlot = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createParkingSlot({
        slotNo: slotForm.slotNo,
        status: 'AVAILABLE', // always start available
        spot: { spotId: showSlotModal },
      });
      setSuccess('Slot added!');
      setShowSlotModal(null);
      setSlotForm({ slotNo: '' });
      load();
    } catch { setError('Failed to add slot.'); }
    setSaving(false);
  };

  const handleBlock = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const { slot } = blockModal;
    const startISO = `${blockForm.date}T${blockForm.fromTime}:00`;
    const endISO   = `${blockForm.date}T${blockForm.toTime}:00`;
    if (new Date(endISO + '+05:30') <= new Date(startISO + '+05:30')) {
      setError('End time must be after start time.'); setSaving(false); return;
    }
    try {
      await createBooking({
        user:          { userId: currentUser.userId },
        slot:          { slotId: slot.slotId },
        vehicle:       { vehicleId: 1 },
        bookingDate:   blockForm.date,
        startTime:     startISO,
        endTime:       endISO,
        bookingStatus: 'BLOCKED',
        bookingCode:   'BLOCK-' + Date.now().toString().slice(-6),
        estimatedAmt:  '0', finalAmt: '0',
        checkoutStatus:'BLOCKED',
        cancellationReason: blockForm.reason || 'Personal use',
      });
      setSuccess(`Slot #${slot.slotNo} blocked from ${blockForm.fromTime} to ${blockForm.toTime} on ${blockForm.date}`);
      setBlockModal(null);
      setBlockForm({ date: '', fromTime: '', toTime: '', reason: '' });
      load();
    } catch { setError('Failed to block slot.'); }
    setSaving(false);
  };

  const handleRemoveBlock = async (blockId) => {
    if (!window.confirm('Remove this block?')) return;
    try {
      const res = await fetch(`http://localhost:8080/bookings/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutStatus: 'CANCELLED', bookingStatus: 'CANCELLED' }),
      });
      if (!res.ok) throw new Error();
      setSuccess('Block removed.');
      load();
    } catch { setError('Could not remove block. Make sure PUT /bookings/{id} is in your backend.'); }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>My Parking Spots</h1>
          <p>Real-time slot status based on live bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh">↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => { setShowSpotModal(true); setError(''); }}>+ Add Spot</button>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Status Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { icon: '🟢', label: 'Available', desc: 'Ready for booking', bg: '#f0fdf4', color: '#166534' },
          { icon: '⏳', label: 'Hold', desc: 'User has 10-min hold', bg: '#fff7ed', color: '#92400e' },
          { icon: '🔵', label: 'Reserved', desc: 'Booking confirmed', bg: '#eff6ff', color: '#1e40af' },
          { icon: '🔒', label: 'Blocked', desc: 'Lender blocked this time', bg: '#fef9c3', color: '#713f12' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: item.bg, border: `1px solid`, borderColor: item.bg }}>
            <span style={{ fontSize: '14px' }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: item.color, opacity: 0.7 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {spots.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏢</div>
          <p>No spots listed yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowSpotModal(true)}>Add Parking Spot</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {spots.map(spot => {
            const spotSlots = getSlots(spot.spotId);
            // Compute dynamic status for each slot
            const slotStatuses = spotSlots.map(sl => ({
              ...sl,
              dynamic: getDynamicStatus(sl.slotId, bookings),
            }));
            const availableCount = slotStatuses.filter(s => s.dynamic.status === 'AVAILABLE').length;
            const reservedCount  = slotStatuses.filter(s => s.dynamic.status === 'RESERVED' || s.dynamic.status === 'HOLD').length;
            const blockedCount   = slotStatuses.filter(s => s.dynamic.status === 'BLOCKED').length;

            return (
              <div key={spot.spotId} className="card" style={{ padding: '24px' }}>
                {/* Spot Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>{spot.spotName}</h3>
                      <span className={`badge badge-${spotStatusColor(spot.approvalStatus)}`}>{spot.approvalStatus}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '13px' }}>📍 {spot.address}</p>
                    {spot.location && <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{spot.location.areaName}, {spot.location.city}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f59e0b', fontSize: '1.3rem' }}>₹{spot.pricePerHr}/hr</div>
                    {/* Spot summary counts */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>🟢 {availableCount}</span>
                      {reservedCount > 0 && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>🔵 {reservedCount}</span>}
                      {blockedCount > 0 && <span style={{ fontSize: '11px', background: '#fff7ed', color: '#92400e', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>🔒 {blockedCount}</span>}
                    </div>
                  </div>
                </div>

                {/* Slots */}
                <div style={{ borderTop: '1px solid #e2e5f0', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      Slots — {availableCount} available, {reservedCount} reserved, {blockedCount} blocked
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setShowSlotModal(spot.spotId); setError(''); }}>+ Add Slot</button>
                  </div>

                  {slotStatuses.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>No slots added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {slotStatuses.map(sl => {
                        const { status, booking: activeBooking } = sl.dynamic;
                        const st = slotStatusStyle(status);
                        const slotBlocks = getBlocks(sl.slotId);

                        return (
                          <div key={sl.slotId} style={{
                            background: st.bg,
                            border: `1.5px solid ${st.border}`,
                            borderRadius: '12px', padding: '14px 16px',
                          }}>
                            {/* Slot row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>{st.icon}</span>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                                    Slot #{sl.slotNo}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                    <span style={{
                                      padding: '2px 10px', borderRadius: '20px', fontSize: '10px',
                                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                                      background: st.border, color: st.color,
                                    }}>{st.label}</span>
                                    {/* Active booking info */}
                                    {activeBooking && (status === 'RESERVED' || status === 'HOLD') && (
                                      <span style={{ fontSize: '11px', color: '#475569' }}>
                                        · {activeBooking.user?.name || `User #${activeBooking.user?.userId}`}
                                        {' · '} {activeBooking.vehicle?.vehicleNo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Block button — always visible so lender can block any future time */}
                              <button
                                onClick={() => { setBlockModal({ slot: sl }); setBlockForm({ date: todayStr, fromTime: '', toTime: '', reason: '' }); setError(''); }}
                                style={{
                                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                                  fontFamily: 'var(--font-display)', fontWeight: 600,
                                  background: '#fff7ed', border: '1.5px solid #fed7aa',
                                  color: '#92400e', cursor: 'pointer',
                                }}>
                                🔒 Block Time
                              </button>
                            </div>

                            {/* Active booking details */}
                            {activeBooking && (status === 'RESERVED' || status === 'HOLD') && (
                              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${st.border}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                                <div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Booking Code</div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{activeBooking.bookingCode || `#${activeBooking.bookingId}`}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Time</div>
                                  <div style={{ fontSize: '12px', color: '#475569' }}>
                                    {activeBooking.startTime ? parseLocal(activeBooking.startTime)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                                    {' → '}
                                    {activeBooking.endTime ? parseLocal(activeBooking.endTime)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Amount</div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>₹{activeBooking.estimatedAmt}</div>
                                </div>
                              </div>
                            )}

                            {/* Scheduled blocks */}
                            {slotBlocks.length > 0 && (
                              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${st.border}` }}>
                                <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                  Scheduled Blocks
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {slotBlocks.map(block => {
                                    const bStart = parseLocal(block.startTime);
                                    const bEnd   = parseLocal(block.endTime);
                                    const now    = new Date();
                                    const isNow  = bStart && bEnd && now >= bStart && now <= bEnd;
                                    const isPast = bEnd && now > bEnd;
                                    return (
                                      <div key={block.bookingId} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: isNow ? '#ffedd5' : isPast ? '#f8fafc' : '#fff',
                                        borderRadius: '8px', padding: '7px 12px',
                                        border: `1px solid ${isNow ? '#fbd38d' : '#e2e5f0'}`,
                                        opacity: isPast ? 0.55 : 1,
                                      }}>
                                        <div style={{ fontSize: '12px', color: '#0f172a' }}>
                                          📅 <strong>{block.bookingDate}</strong>
                                          {'  '}🕐 {bStart?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} → {bEnd?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                          {isNow && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#92400e', fontWeight: 700, background: '#fed7aa', padding: '1px 6px', borderRadius: '4px' }}>NOW</span>}
                                          {isPast && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#94a3b8' }}>expired</span>}
                                          {block.cancellationReason && block.cancellationReason !== 'Personal use' && (
                                            <span style={{ marginLeft: '8px', color: '#64748b' }}>— {block.cancellationReason}</span>
                                          )}
                                        </div>
                                        <button onClick={() => handleRemoveBlock(block.bookingId)}
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD SPOT MODAL */}
      {showSpotModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSpotModal(false); }}>
          <div className="modal">
            <h2>Submit Parking Spot</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Reviewed by admin before going live.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddSpot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group"><label>Spot Name</label><input placeholder="e.g. Ground Floor Block A" value={spotForm.spotName} onChange={e => setSpotForm(p => ({ ...p, spotName: e.target.value }))} required /></div>
              <div className="form-group"><label>Address</label><input placeholder="Full address" value={spotForm.address} onChange={e => setSpotForm(p => ({ ...p, address: e.target.value }))} required /></div>
              <div className="form-group"><label>Price per Hour (₹)</label><input type="number" step="0.01" placeholder="e.g. 50" value={spotForm.pricePerHr} onChange={e => setSpotForm(p => ({ ...p, pricePerHr: e.target.value }))} required /></div>
              <div className="form-group">
                <label>Location</label>
                <select value={spotForm.locationId} onChange={e => setSpotForm(p => ({ ...p, locationId: e.target.value }))} required>
                  <option value="">-- Select Location --</option>
                  {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.areaName}, {l.city} – {l.pincode}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSpotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Spot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SLOT MODAL */}
      {showSlotModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSlotModal(null); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h2>Add Parking Slot</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Slots always start as Available. Status updates automatically based on bookings.</p>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Slot Label</label>
                <input placeholder="e.g. A1, B2, 101" value={slotForm.slotNo} onChange={e => setSlotForm({ slotNo: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSlotModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCK SLOT MODAL */}
      {blockModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setBlockModal(null); }}>
          <div className="modal" style={{ maxWidth: '460px' }}>
            <h2>🔒 Block Slot #{blockModal.slot.slotNo}</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Users cannot book this slot during the blocked time.</p>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#78350f' }}>
              Set the date and time you need this slot for yourself. It will appear as unavailable to users during that window.
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleBlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group"><label>Date</label><input type="date" value={blockForm.date} min={todayStr} onChange={e => setBlockForm(p => ({ ...p, date: e.target.value }))} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>From</label><input type="time" value={blockForm.fromTime} onChange={e => setBlockForm(p => ({ ...p, fromTime: e.target.value }))} required /></div>
                <div className="form-group"><label>To</label><input type="time" value={blockForm.toTime} onChange={e => setBlockForm(p => ({ ...p, toTime: e.target.value }))} required /></div>
              </div>
              <div className="form-group"><label>Reason (optional)</label><input placeholder="e.g. Personal use, Maintenance..." value={blockForm.reason} onChange={e => setBlockForm(p => ({ ...p, reason: e.target.value }))} /></div>
              {blockForm.date && blockForm.fromTime && blockForm.toTime && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e5f0', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#0f172a' }}>
                  🔒 Slot <strong>#{blockModal.slot.slotNo}</strong> blocked on <strong>{blockForm.date}</strong> from <strong>{blockForm.fromTime}</strong> to <strong>{blockForm.toTime}</strong>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setBlockModal(null)}>Cancel</button>
                <button type="submit" className="btn" disabled={saving} style={{ background: '#f59e0b', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {saving ? 'Blocking...' : '🔒 Confirm Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
