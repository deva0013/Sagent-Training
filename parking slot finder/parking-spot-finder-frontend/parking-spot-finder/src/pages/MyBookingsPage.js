import React, { useEffect, useState } from 'react';
import { getBookings, getWallets } from '../services/api';
import { useAuth } from '../context/AuthContext';
 
const BASE_URL = 'http://localhost:8080';
 
const statusColor = (s) => {
  if (!s) return 'neutral';
  const sl = s.toLowerCase();
  if (sl.includes('confirm') || sl.includes('complete')) return 'success';
  if (sl.includes('pending') || sl.includes('hold'))    return 'warning';
  if (sl.includes('cancel'))                             return 'danger';
  return 'neutral';
};
 
/*
  parseLocalDateTime — Spring Boot saves LocalDateTime without timezone.
  Handles full datetime, time-only, space-separated, microseconds.
  Always interprets as IST (UTC+5:30).
*/
const parseLocalDateTime = (dtStr, fallbackDate) => {
  if (!dtStr) return null;
  let s = String(dtStr).trim();
  if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  s = s.replace(/\.\d+$/, '');
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const base = fallbackDate || new Date().toISOString().slice(0, 10);
    s = `${base}T${s}`;
  }
  s = s.replace(' ', 'T');
  return new Date(s + '+05:30');
};
 
/*
  calcLateFee — mirrors BookingService.calculateLateFee on the backend.
  Used only for DISPLAY in the checkout modal. Actual deduction is done by backend.
  - 5 min grace, then ₹ceil(pricePerHr/12) per 5-min block, capped at 2× estimatedAmt
*/
const GRACE_MINUTES = 5;
const BLOCK_MINUTES = 5;
 
const calcLateFee = (booking) => {
  const now          = new Date();
  const scheduledEnd = parseLocalDateTime(booking.endTime, booking.bookingDate)
                    || parseLocalDateTime(booking.scheduledEndTime, booking.bookingDate);
  const startTime    = parseLocalDateTime(booking.startTime, booking.bookingDate);
 
  if (!scheduledEnd) return { isLate: false, lateMinutes: 0, lateBlocks: 0, lateFee: 0, withinGrace: false, feePerBlock: 0 };
 
  const nowTs = now.getTime(), endTs = scheduledEnd.getTime();
  if (nowTs <= endTs) return { isLate: false, lateMinutes: 0, lateBlocks: 0, lateFee: 0, withinGrace: false, feePerBlock: 0 };
 
  const lateMinutes = Math.ceil((nowTs - endTs) / 60000);
  if (lateMinutes <= GRACE_MINUTES) return { isLate: false, lateMinutes, lateBlocks: 0, lateFee: 0, withinGrace: true, feePerBlock: 0 };
 
  const estimatedAmt = parseFloat(booking.estimatedAmt || 0);
  let pricePerHr = 50;
  if (startTime && estimatedAmt > 0) {
    const hrs = (endTs - startTime.getTime()) / 3600000;
    if (hrs > 0) pricePerHr = estimatedAmt / hrs;
  }
  const feePerBlock = Math.ceil(pricePerHr / 12);
  const maxFine     = estimatedAmt * 2;
  const lateBlocks  = Math.ceil((lateMinutes - GRACE_MINUTES) / BLOCK_MINUTES);
  const lateFee     = Math.min(lateBlocks * feePerBlock, maxFine);
 
  return { isLate: true, lateMinutes, lateBlocks, lateFee, withinGrace: false, feePerBlock };
};
 
const calcCheckout = (booking) => {
  const initialPaid  = parseFloat(booking.additionalFee || 0);
  const estimatedAmt = parseFloat(booking.estimatedAmt  || 0);
  const remaining    = Math.max(0, estimatedAmt - initialPaid);
  const { isLate, lateMinutes, lateBlocks, lateFee, withinGrace, feePerBlock } = calcLateFee(booking);
  return {
    initialPaid, estimatedAmt, remaining,
    isLate, lateMinutes, lateBlocks, lateFee, withinGrace, feePerBlock,
    totalDue:     remaining + lateFee,
    fullFinalAmt: estimatedAmt + lateFee,
  };
};
 
export default function MyBookingsPage() {
  const { currentUser }                   = useAuth();
  const [bookings, setBookings]           = useState([]);
  const [myWallet, setMyWallet]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('ALL');
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [cancelModal, setCancelModal]     = useState(null);
  const [cancelReason, setCancelReason]   = useState('');
  const [processing, setProcessing]       = useState(false);
  const [success, setSuccess]             = useState('');
  const [error, setError]                 = useState('');
 
  // Re-render every 60s so live late fee stays current
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => p+1), 60000); return () => clearInterval(t); }, []);
 
  const load = async () => {
    try {
      const [all, wallets] = await Promise.all([getBookings(), getWallets()]);
      setBookings(all.filter(b => b.user?.userId === currentUser.userId));
      setMyWallet(wallets.find(w => w.user?.userId === currentUser.userId) || null);
    } catch {}
    setLoading(false);
  };
 
  useEffect(() => { load(); }, [currentUser]);
 
  const canCheckout = (b) => (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'HOLD') && b.checkoutStatus !== 'COMPLETED';
  const canCancel   = (b) => (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'HOLD') && b.checkoutStatus !== 'COMPLETED';
 
  // Open checkout modal — fetches accurate late fee from backend
  const openCheckoutModal = async (b) => {
    setError('');
    setCheckoutModal({ booking: b, backendLateFee: null, fetching: true });
    try {
      const res = await fetch(`${BASE_URL}/bookings/${b.bookingId}/late-fee`);
      if (res.ok) {
        const data = await res.json();
        setCheckoutModal({ booking: b, backendLateFee: parseFloat(data.lateFee ?? 0), fetching: false });
      } else {
        setCheckoutModal({ booking: b, backendLateFee: null, fetching: false });
      }
    } catch {
      setCheckoutModal({ booking: b, backendLateFee: null, fetching: false });
    }
  };
 
  // ── CHECKOUT ─────────────────────────────────────────────────────
  // Calls POST /bookings/{id}/checkout — backend handles everything:
  //   deduct user wallet, credit lender 90%, credit admin 10%, record all transactions
  const confirmCheckout = async () => {
    setProcessing(true); setError('');
    const { booking, backendLateFee } = checkoutModal;
 
    // Use backend late fee if available, otherwise frontend estimate
    const frontendCalc = calcCheckout(booking);
    const lateFee  = backendLateFee !== null && backendLateFee !== undefined
                     ? backendLateFee : frontendCalc.lateFee;
    const totalDue = frontendCalc.remaining + lateFee;
 
    if (myWallet && totalDue > 0 && parseFloat(myWallet.balance || 0) < totalDue) {
      setError(`Insufficient balance. Need ₹${totalDue.toFixed(2)}, have ₹${parseFloat(myWallet.balance || 0).toFixed(2)}. Please top up.`);
      setProcessing(false); return;
    }
 
    try {
      const res = await fetch(`${BASE_URL}/bookings/${booking.bookingId}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Checkout failed (${res.status})`);
      }
      const msg = lateFee > 0
        ? `✅ Checked out! Paid ₹${totalDue.toFixed(2)} (₹${frontendCalc.remaining.toFixed(2)} remaining + ₹${lateFee.toFixed(2)} late fee)`
        : `✅ Checked out! ₹${totalDue.toFixed(2)} paid.`;
      setSuccess(msg);
      setCheckoutModal(null);
      load();
    } catch (e) {
      setError(e?.message || 'Checkout failed. Check backend is running.');
    }
    setProcessing(false);
  };
 
  // ── CANCEL ────────────────────────────────────────────────────────
  // Backend (POST /bookings/{id}/cancel) handles:
  //   1. Refund initial payment to user wallet
  //   2. Reverse lender credit
  //   3. Reverse admin commission
  //   4. Record refund transaction
  const confirmCancel = async () => {
    setProcessing(true); setError('');
    const { booking } = cancelModal;
    const reason = cancelReason || 'Cancelled by user';
 
    try {
      const res = await fetch(`${BASE_URL}/bookings/${booking.bookingId}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
 
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Cancel failed (${res.status})`);
      }
 
      const refundAmt = parseFloat(booking.additionalFee || booking.estimatedAmt || 0);
      setSuccess(refundAmt > 0
        ? `Booking cancelled. ₹${refundAmt.toFixed(2)} refunded to your wallet.`
        : 'Booking cancelled.');
      setCancelModal(null); setCancelReason('');
      load();
    } catch (e) {
      setError(e?.message || 'Cancellation failed. Check backend is running.');
    }
    setProcessing(false);
  };
 
  const statuses = ['ALL','HOLD','CONFIRMED','COMPLETED','CANCELLED'];
  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.bookingStatus === filter);
 
  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;
 
  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>View, checkout, or cancel your parking reservations</p>
      </div>
 
      {success && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}
 
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 16px', borderRadius: '20px', border: '1.5px solid',
            borderColor: filter === s ? '#4f46e5' : '#e2e5f0',
            background: filter === s ? '#ede9fe' : 'transparent',
            color: filter === s ? '#4f46e5' : '#64748b',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
          }}>
            {s}
            <span style={{ marginLeft: '5px', background: '#f1f5f9', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', color: '#64748b' }}>
              {s === 'ALL' ? bookings.length : bookings.filter(b => b.bookingStatus === s).length}
            </span>
          </button>
        ))}
      </div>
 
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No bookings found.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(b => {
            const { isLate, lateMinutes, lateBlocks, lateFee, withinGrace, feePerBlock } = canCheckout(b)
              ? calcLateFee(b)
              : { isLate: false, lateMinutes: 0, lateBlocks: 0, lateFee: 0, withinGrace: false, feePerBlock: 0 };
 
            return (
              <div key={b.bookingId} className="card" style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '20px', alignItems: 'center',
                borderColor: isLate ? 'rgba(239,68,68,0.4)' : withinGrace ? 'rgba(245,158,11,0.4)' : undefined,
                background: isLate ? 'rgba(239,68,68,0.02)' : undefined,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>#{b.bookingCode || `BK-${b.bookingId}`}</span>
                    <span className={`badge badge-${statusColor(b.bookingStatus)}`}>{b.bookingStatus}</span>
                    {isLate      && <span className="badge badge-danger">OVERDUE</span>}
                    {withinGrace && <span className="badge badge-warning">GRACE</span>}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>📅 {b.bookingDate}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>🚗 {b.vehicle?.vehicleNo || 'N/A'} &nbsp;|&nbsp; Slot #{b.slot?.slotNo || b.slot?.slotId}</div>
                  {b.cancellationReason && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>✗ {b.cancellationReason}</div>}
                </div>
 
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule</div>
                  <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{b.startTime ? parseLocalDateTime(b.startTime, b.bookingDate)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>to</div>
                  <div style={{ fontSize: '13px', color: isLate ? '#ef4444' : '#475569', fontWeight: 500 }}>
                    {b.endTime ? parseLocalDateTime(b.endTime, b.bookingDate)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                    {isLate && ' ⚠'}
                  </div>
                </div>
 
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</div>
                  <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>₹{b.estimatedAmt || '0'}</div>
                  {isLate && feePerBlock > 0 && (
                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>Fine: ₹{lateFee.toFixed(0)} ({lateBlocks}×₹{feePerBlock})</div>
                  )}
                </div>
 
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Checkout</div>
                  <span className={`badge badge-${b.checkoutStatus === 'COMPLETED' ? 'success' : b.checkoutStatus === 'CANCELLED' ? 'danger' : 'neutral'}`}>{b.checkoutStatus || 'PENDING'}</span>
                  {b.checkoutTime && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>at {parseLocalDateTime(b.checkoutTime)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
 
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  {canCheckout(b) && (
                    <button onClick={() => openCheckoutModal(b)} style={{
                      background: isLate ? '#ef4444' : withinGrace ? '#f59e0b' : '#4f46e5',
                      color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>{isLate ? 'Checkout ⚠' : 'Check Out'}</button>
                  )}
                  {canCancel(b) && (
                    <button onClick={() => { setCancelModal({ booking: b }); setCancelReason(''); }} style={{
                      background: 'transparent', color: '#ef4444', border: '1.5px solid rgba(239,68,68,0.35)',
                      borderRadius: '10px', padding: '6px 14px', fontFamily: 'var(--font-display)',
                      fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>Cancel</button>
                  )}
                  {!canCheckout(b) && !canCancel(b) && (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {b.bookingStatus === 'COMPLETED' ? '✓ Done' : b.bookingStatus === 'CANCELLED' ? '✗ Cancelled' : '—'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
 
      {/* ===== CHECKOUT MODAL ===== */}
      {checkoutModal && (() => {
        const { booking, backendLateFee, fetching } = checkoutModal;
        const calc        = calcCheckout(booking);
        // Use backend late fee (server-side accuracy) if fetched, else frontend estimate
        const lateFee     = (backendLateFee !== null && backendLateFee !== undefined) ? backendLateFee : calc.lateFee;
        const isLate      = lateFee > 0;
        const withinGrace = !isLate && calc.withinGrace;
        const { initialPaid, estimatedAmt, remaining, lateMinutes, lateBlocks, feePerBlock } = calc;
        const totalDue    = remaining + lateFee;
        return (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCheckoutModal(null); }}>
            <div className="modal" style={{ maxWidth: '480px' }}>
              <h2 style={{ marginBottom: '4px' }}>Check Out</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Review your bill and confirm checkout</p>
              {fetching && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 14px', marginBottom: '12px', fontSize: '12px', color: '#0369a1' }}>
                  ⏳ Calculating fine from server...
                </div>
              )}
 
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #e2e5f0' }}>
                <div style={{ fontWeight: 700, marginBottom: '10px', fontFamily: 'var(--font-display)', color: '#0f172a' }}>#{booking.bookingCode || booking.bookingId}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>VEHICLE</div><div style={{ fontWeight: 500 }}>{booking.vehicle?.vehicleNo || 'N/A'}</div></div>
                  <div><div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>SLOT</div><div style={{ fontWeight: 500 }}>#{booking.slot?.slotNo || booking.slot?.slotId}</div></div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>START</div>
                    <div>{booking.startTime ? parseLocalDateTime(booking.startTime, booking.bookingDate)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>SCHEDULED END</div>
                    <div style={{ color: isLate ? '#ef4444' : '#0f172a' }}>
                      {booking.endTime ? parseLocalDateTime(booking.endTime, booking.bookingDate)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                      {isLate && ' ⚠'}
                    </div>
                  </div>
                </div>
              </div>
 
              {withinGrace && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ color: '#92400e', fontWeight: 700, fontSize: '13px' }}>Within Grace Period</div>
                  <div style={{ color: '#78350f', fontSize: '12px' }}>5-minute grace period — no late fee charged.</div>
                </div>
              )}
 
              {isLate && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
                    Late Checkout — {lateMinutes} min past end (5 min grace deducted)
                  </div>
                  <div style={{ color: '#7f1d1d', fontSize: '12px' }}>
                    ₹{feePerBlock}/5-min block → {lateBlocks} block{lateBlocks > 1 ? 's' : ''} = ₹{lateFee.toFixed(0)}
                  </div>
                </div>
              )}
 
              <div style={{ border: '1px solid #e2e5f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '11px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e5f0' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Total Parking Charge</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{estimatedAmt.toFixed(2)}</span>
                </div>
                <div style={{ padding: '11px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e5f0', background: '#f0fdf4' }}>
                  <div>
                    <div style={{ color: '#166534', fontSize: '13px', fontWeight: 600 }}>Already Paid (1 hr initial)</div>
                    <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '1px' }}>Deducted at booking time</div>
                  </div>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>− ₹{initialPaid.toFixed(2)}</span>
                </div>
                {remaining > 0 && (
                  <div style={{ padding: '11px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e5f0' }}>
                    <span style={{ color: '#4f46e5', fontSize: '13px', fontWeight: 600 }}>Remaining Balance</span>
                    <span style={{ color: '#4f46e5', fontWeight: 700 }}>₹{remaining.toFixed(2)}</span>
                  </div>
                )}
                {isLate && (
                  <div style={{ padding: '11px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e5f0', background: '#fef2f2' }}>
                    <div>
                      <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
                        Late Fine
                        {lateFee >= estimatedAmt * 2 && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px' }}>CAPPED</span>}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '1px' }}>{lateMinutes} min (−5 grace) → {lateBlocks} blocks × ₹{feePerBlock}/5min</div>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>+ ₹{lateFee.toFixed(0)}</span>
                  </div>
                )}
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>Pay Now</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {totalDue === 0 ? 'Nothing due — fully paid' : !isLate ? `Remaining ₹${remaining.toFixed(0)}` : `Remaining + Fine`}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: totalDue > 0 ? '#f59e0b' : '#10b981' }}>₹{totalDue.toFixed(2)}</span>
                </div>
              </div>
 
              {myWallet && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e5f0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>💰 Wallet Balance</span>
                  <span style={{ fontWeight: 700, color: parseFloat(myWallet.balance || 0) >= totalDue ? '#10b981' : '#ef4444' }}>
                    ₹{parseFloat(myWallet.balance || 0).toFixed(2)}
                    {parseFloat(myWallet.balance || 0) < totalDue && <span style={{ fontSize: '11px', marginLeft: '6px', color: '#ef4444' }}>⚠ Insufficient</span>}
                  </span>
                </div>
              )}
 
              {error && <div className="alert alert-error">{error}</div>}
 
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setCheckoutModal(null)}>Cancel</button>
                <button className="btn" style={{ background: isLate ? '#ef4444' : '#10b981', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  onClick={confirmCheckout} disabled={processing}>
                  {processing ? 'Processing...' : totalDue > 0 ? `Pay ₹${totalDue.toFixed(2)} & Checkout` : 'Confirm Checkout'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
 
      {/* ===== CANCEL MODAL ===== */}
      {cancelModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCancelModal(null); }}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <h2 style={{ marginBottom: '6px' }}>Cancel Booking</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Your initial payment will be refunded to your wallet.</p>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #e2e5f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>#{cancelModal.booking.bookingCode || cancelModal.booking.bookingId}</div>
              <div style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>🚗 {cancelModal.booking.vehicle?.vehicleNo} &nbsp;|&nbsp; Slot #{cancelModal.booking.slot?.slotNo || cancelModal.booking.slot?.slotId}</div>
              <div style={{ color: '#16a34a', fontWeight: 700, marginTop: '8px', fontSize: '14px' }}>
                Refund: ₹{parseFloat(cancelModal.booking.additionalFee || cancelModal.booking.estimatedAmt || 0).toFixed(2)}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Reason (optional)</label>
              <textarea rows={3} placeholder="e.g. Plans changed..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#92400e', marginBottom: '16px' }}>
              ⚠ This action cannot be undone.
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setCancelModal(null)}>Go Back</button>
              <button className="btn btn-danger" onClick={confirmCancel} disabled={processing}>
                {processing ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}