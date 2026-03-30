import React, { useEffect, useState } from 'react';
import { getBookings, getParkingSpots, getParkingSlots, getWallets, createTransaction, updateWallet } from '../services/api';
import { useAuth } from '../context/AuthContext';
 
const BASE_URL = 'http://localhost:8080';
const COMMISSION = 0.10;
 
const parseLocal = (dtStr) => {
  if (!dtStr) return null;
  const hasTimezone = dtStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dtStr);
  if (hasTimezone) return new Date(dtStr);
  return new Date(dtStr + '+05:30');
};
 
const formatDateTime = (dtStr) => {
  const d = parseLocal(dtStr);
  if (!d) return '--';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
};
 
const statusColor = (s) => {
  if (!s) return 'neutral';
  const sl = s.toLowerCase();
  if (sl.includes('confirm') || sl.includes('complete')) return 'success';
  if (sl.includes('pending') || sl.includes('hold')) return 'warning';
  if (sl.includes('cancel')) return 'danger';
  return 'neutral';
};
 
export default function LenderBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [myWallet, setMyWallet]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState('');
  const [allSlots, setAllSlots]   = useState([]);
  const [allSpots, setAllSpots]   = useState([]);
  const [allWallets, setAllWallets] = useState([]);
  const [allTxns, setAllTxns]     = useState([]);
 
  const load = async () => {
    setLoading(true);
    try {
      const [allBookings, spots, slots, wallets, txns] = await Promise.all([
        getBookings(), getParkingSpots(), getParkingSlots(), getWallets(),
        fetch(`${BASE_URL}/transactions`).then(r => r.json()),
      ]);
      const mySpotIds = spots.filter(s => s.user?.userId === currentUser.userId).map(s => s.spotId);
      const mySlotIds = slots.filter(sl => mySpotIds.includes(sl.spot?.spotId)).map(sl => sl.slotId);
      const mine = wallets.find(w => w.user?.userId === currentUser.userId);
      setBookings(allBookings.filter(b => mySlotIds.includes(b.slot?.slotId) && b.bookingStatus !== 'BLOCKED'));
      setMyWallet(mine || null);
      setAllSlots(slots);
      setAllSpots(spots);
      setAllWallets(wallets);
      setAllTxns(txns || []);
    } catch {}
    setLoading(false);
  };
 
  useEffect(() => { load(); }, [currentUser]);
 
  // Check if a booking already has SLOT_EARNING credited
  const isAlreadyCredited = (bookingId) =>
    allTxns.some(t => t.booking?.bookingId === bookingId && t.purpose === 'SLOT_EARNING');
 
  // Sync all completed/confirmed bookings that haven't been credited yet
  const handleSync = async () => {
    setSyncing(true); setSyncMsg('');
    let credited = 0;
    try {
      const freshWallets = await fetch(`${BASE_URL}/wallets`).then(r => r.json());
      const freshUsers   = await fetch(`${BASE_URL}/users`).then(r => r.json());
      const adminUser    = freshUsers.find(u => u.role === 'PARKING_ADMIN');
 
      for (const b of bookings) {
        if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'BLOCKED') continue;
        if (isAlreadyCredited(b.bookingId)) continue;
 
        const amt = parseFloat(b.finalAmt || b.estimatedAmt || 0);
        if (!amt || amt <= 0) continue;
 
        const lenderCut = parseFloat((amt * (1 - COMMISSION)).toFixed(2));
        const adminCut  = parseFloat((amt * COMMISSION).toFixed(2));
 
        // Credit lender wallet
        const lenderW = freshWallets.find(w => w.user?.userId === currentUser.userId);
        if (lenderW) {
          const newBal = (parseFloat(lenderW.balance || 0) + lenderCut).toFixed(2);
          await fetch(`${BASE_URL}/wallets/${lenderW.walletId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...lenderW, balance: newBal, lastUpdated: new Date().toISOString() }),
          });
          await fetch(`${BASE_URL}/transactions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: { walletId: lenderW.walletId },
              booking: { bookingId: b.bookingId },
              amount: lenderCut.toFixed(2),
              transactionType: 'CREDIT', purpose: 'SLOT_EARNING',
              transactionStatus: 'SUCCESS', transactionTime: new Date().toISOString(),
            }),
          });
          // Update balance in loop for next iteration
          const idx = freshWallets.findIndex(w => w.walletId === lenderW.walletId);
          if (idx !== -1) freshWallets[idx] = { ...lenderW, balance: newBal };
        }
 
        // Credit admin wallet
        if (adminUser) {
          let adminW = freshWallets.find(w => w.user?.userId === adminUser.userId);
          if (!adminW) {
            adminW = await fetch(`${BASE_URL}/wallets`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user: { userId: adminUser.userId }, balance: '0.00' }),
            }).then(r => r.json());
            freshWallets.push(adminW);
          }
          if (adminW?.walletId) {
            const newAdminBal = (parseFloat(adminW.balance || 0) + adminCut).toFixed(2);
            await fetch(`${BASE_URL}/wallets/${adminW.walletId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...adminW, balance: newAdminBal, lastUpdated: new Date().toISOString() }),
            });
            await fetch(`${BASE_URL}/transactions`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wallet: { walletId: adminW.walletId },
                booking: { bookingId: b.bookingId },
                amount: adminCut.toFixed(2),
                transactionType: 'CREDIT', purpose: 'COMMISSION',
                transactionStatus: 'SUCCESS', transactionTime: new Date().toISOString(),
              }),
            });
            const idx = freshWallets.findIndex(w => w.walletId === adminW.walletId);
            if (idx !== -1) freshWallets[idx] = { ...adminW, balance: newAdminBal };
          }
        }
        credited++;
      }
      setSyncMsg(credited > 0
        ? `✅ Synced ${credited} booking(s). Your wallet has been updated with all earnings.`
        : '✅ All bookings already credited. Your wallet is up to date.'
      );
      load();
    } catch (e) {
      setSyncMsg('❌ Sync failed. Please try again.');
    }
    setSyncing(false);
  };
 
  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;
 
  const completedBookings  = bookings.filter(b => b.bookingStatus === 'COMPLETED');
  const confirmedBookings  = bookings.filter(b => b.bookingStatus === 'CONFIRMED');
  const cancelledBookings  = bookings.filter(b => b.bookingStatus === 'CANCELLED');
  const totalGross         = completedBookings.reduce((s, b) => s + parseFloat(b.finalAmt || b.estimatedAmt || 0), 0);
  const totalEarned        = totalGross * (1 - COMMISSION);
  const uncreditedCount    = bookings.filter(b => b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'BLOCKED' && !isAlreadyCredited(b.bookingId) && parseFloat(b.finalAmt || b.estimatedAmt || 0) > 0).length;
 
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Bookings for My Spots</h1>
          <p>{bookings.length} total bookings across {new Set(bookings.map(b => b.slot?.slotId)).size} slots</p>
        </div>
        <button
          onClick={handleSync} disabled={syncing}
          style={{ padding: '10px 20px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {syncing ? '⏳ Syncing...' : `🔄 Sync Earnings${uncreditedCount > 0 ? ` (${uncreditedCount} pending)` : ''}`}
        </button>
      </div>
 
      {syncMsg && (
        <div style={{ background: syncMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${syncMsg.startsWith('✅') ? '#bbf7d0' : '#fca5a5'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: syncMsg.startsWith('✅') ? '#166534' : '#991b1b' }}>
          {syncMsg}
        </div>
      )}
 
      {/* Wallet balance strip */}
      {myWallet && (
        <div style={{ background: '#fff', border: '1px solid #e2e5f0', borderRadius: '12px', padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>💰 Wallet Balance</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>₹{parseFloat(myWallet.balance || 0).toFixed(2)}</span>
        </div>
      )}
 
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total Bookings', value: bookings.length,                color: '#4f46e5', bg: '#ede9fe', icon: '📋' },
          { label: 'Confirmed',      value: confirmedBookings.length,       color: '#10b981', bg: '#d1fae5', icon: '✅' },
          { label: 'Total Earned',   value: `₹${totalEarned.toFixed(2)}`,  color: '#f59e0b', bg: '#fef3c7', icon: '💰' },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{ background: bg, borderRadius: '14px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
              <span style={{ fontSize: '18px' }}>{icon}</span>
            </div>
            <div style={{ fontSize: typeof value === 'string' && value.includes('₹') ? '1.4rem' : '2rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
          </div>
        ))}
      </div>
 
      {/* Bookings table */}
      {bookings.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No bookings on your spots yet.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking Code</th>
                  <th>Spot / Slot</th>
                  <th>User</th>
                  <th>Vehicle</th>
                  <th>Date &amp; Time</th>
                  <th>Booking Amt</th>
                  <th>Your Earning (90%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const amt     = parseFloat(b.finalAmt || b.estimatedAmt || 0);
                  const earning = amt * (1 - COMMISSION);
                  const isCancelled = b.bookingStatus === 'CANCELLED';
                  const slotData  = allSlots.find(sl => sl.slotId === b.slot?.slotId);
                  const spotData  = allSpots.find(sp => sp.spotId === slotData?.spot?.spotId);
                  return (
                    <tr key={b.bookingId}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>{b.bookingCode || `#${b.bookingId}`}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text2)' }}>
                        {spotData ? <span style={{ color: '#0f172a', fontWeight: 600 }}>{spotData.spotName}</span> : ''}
                        {slotData ? <span style={{ color: '#94a3b8' }}> · Slot #{slotData.slotNo}</span> : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>{b.user?.name || `User #${b.user?.userId}`}</td>
                      <td style={{ fontSize: '13px' }}>{b.vehicle?.vehicleNo || '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text2)' }}>
                        {b.bookingDate}<br />
                        <span style={{ color: '#94a3b8' }}>
                          {parseLocal(b.startTime)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) || '—'} →{' '}
                          {parseLocal(b.endTime)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) || '—'}
                        </span>
                      </td>
                      <td style={{ color: '#f59e0b', fontWeight: 700 }}>₹{amt.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: isCancelled ? '#94a3b8' : '#10b981', fontFamily: 'var(--font-display)' }}>
                        {isCancelled ? '—' : `+₹${earning.toFixed(2)}`}
                      </td>
                      <td><span className={`badge badge-${statusColor(b.bookingStatus)}`}>{b.bookingStatus}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
 