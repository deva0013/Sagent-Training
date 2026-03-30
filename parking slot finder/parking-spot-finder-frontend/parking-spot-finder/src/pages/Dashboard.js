import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBookings, getParkingSpots, getUsers, getWallets, getParkingSlots, getVehicles } from '../services/api';

const statusColor = (s) => {
  if (!s) return 'neutral';
  s = s.toLowerCase();
  if (s.includes('confirm') || s.includes('active') || s.includes('approve')) return 'success';
  if (s.includes('pending') || s.includes('hold')) return 'warning';
  if (s.includes('cancel') || s.includes('reject')) return 'danger';
  return 'neutral';
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: '22px' }}>{icon}</div>
    </div>
    <div className="stat-value" style={{ color }}>{value}</div>
    <div className="stat-sub">{sub}</div>
  </div>
);

const QuickLink = ({ to, icon, label, desc, color }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 16px', borderRadius: '12px',
    background: '#fff', border: '1px solid #e2e5f0',
    textDecoration: 'none', transition: 'all 0.15s',
    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ width: 42, height: 42, borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{desc}</div>
    </div>
    <div style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '16px' }}>→</div>
  </Link>
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [bookings, spots, users, wallets, slots, vehicles] = await Promise.all([
          getBookings(), getParkingSpots(), getUsers(), getWallets(), getParkingSlots(), getVehicles()
        ]);
        const myBookings = bookings.filter(b => b.user?.userId === currentUser.userId);
        const mySpots = spots.filter(s => s.user?.userId === currentUser.userId);
        const myWallet = wallets.find(w => w.user?.userId === currentUser.userId);
        const myVehicles = vehicles.filter(v => v.user?.userId === currentUser.userId);
        setData({ bookings, spots, users, wallets, slots, vehicles, myBookings, mySpots, myWallet, myVehicles });
      } catch {}
      setLoading(false);
    };
    load();
  }, [currentUser]);

  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;

  const role = currentUser.role;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a' }}>
            {greeting()}, {currentUser.name.split(' ')[0]} 👋
          </h1>
        </div>
        {role === 'USER' && (
          <Link to="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', textDecoration: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
            boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
          }}>🔍 Find Parking →</Link>
        )}
        {role === 'SPOT_LENDER' && (
          <Link to="/my-spots" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff', textDecoration: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
            boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
          }}>+ Add New Spot</Link>
        )}
      </div>

      {/* USER */}
      {role === 'USER' && (
        <>
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <StatCard label="Total Bookings" value={data.myBookings?.length || 0} sub="All time" color="#4f46e5" icon="📋" />
            <StatCard label="Active Now" value={data.myBookings?.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'HOLD').length || 0} sub="Confirmed / Hold" color="#10b981" icon="✅" />
            <StatCard label="Wallet Balance" value={`₹${parseFloat(data.myWallet?.balance || 0).toFixed(2)}`} sub="Available" color="#f59e0b" icon="💰" />
            <StatCard label="Vehicles" value={data.myVehicles?.length || 0} sub="Registered" color="#3b82f6" icon="🚗" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e5f0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '16px', color: '#0f172a' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <QuickLink to="/search" icon="🔍" label="Find Parking" desc="Search available spots near you" color="#ede9fe" />
                <QuickLink to="/my-bookings" icon="📋" label="My Bookings" desc="View all your reservations" color="#dbeafe" />
                <QuickLink to="/vehicles" icon="🚗" label="Vehicles" desc="Manage registered vehicles" color="#d1fae5" />
                <QuickLink to="/wallet" icon="💰" label="Wallet" desc="Add money, view transactions" color="#fef3c7" />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e5f0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', color: '#0f172a' }}>Recent Bookings</h3>
                <Link to="/my-bookings" style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
              </div>
              {!data.myBookings?.length ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <span className="icon">🅿️</span>
                  <p>No bookings yet. Find your first spot!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.myBookings.slice(0, 5).map(b => (
                    <div key={b.bookingId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e5f0' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>#{b.bookingCode || `BK-${b.bookingId}`}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{b.bookingDate}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${statusColor(b.bookingStatus)}`}>{b.bookingStatus}</span>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>₹{b.estimatedAmt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SPOT LENDER */}
      {role === 'SPOT_LENDER' && (
        <>
          <div className="grid-3" style={{ marginBottom: '28px' }}>
            <StatCard label="My Spots" value={data.mySpots?.length || 0} sub="Total listed" color="#4f46e5" icon="🏢" />
            <StatCard label="Approved" value={data.mySpots?.filter(s => s.approvalStatus === 'APPROVED').length || 0} sub="Active & live" color="#10b981" icon="✅" />
            <StatCard label="Pending" value={data.mySpots?.filter(s => s.approvalStatus === 'PENDING').length || 0} sub="Awaiting review" color="#f59e0b" icon="⏳" />
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e5f0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '16px', color: '#0f172a' }}>My Spots</h3>
            {!data.mySpots?.length ? (
              <div className="empty-state"><span className="icon">🏢</span><p>No spots yet. Add your first one!</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Spot Name</th><th>Address</th><th>Price/Hr</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.mySpots.map(s => (
                      <tr key={s.spotId}>
                        <td style={{ color: '#0f172a', fontWeight: 600 }}>{s.spotName}</td>
                        <td>{s.address}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>₹{s.pricePerHr}</td>
                        <td><span className={`badge badge-${statusColor(s.approvalStatus)}`}>{s.approvalStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ADMIN */}
      {role === 'PARKING_ADMIN' && (
        <>
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <StatCard label="Total Users" value={data.users?.length || 0} sub="Registered" color="#4f46e5" icon="👥" />
            <StatCard label="Parking Spots" value={data.spots?.length || 0} sub="All spots" color="#10b981" icon="🅿️" />
            <StatCard label="Bookings" value={data.bookings?.length || 0} sub="All time" color="#3b82f6" icon="📋" />
            <StatCard label="Pending Approval" value={data.spots?.filter(s => s.approvalStatus === 'PENDING').length || 0} sub="Need review" color="#ef4444" icon="⚠️" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e5f0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '16px', color: '#0f172a' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <QuickLink to="/admin/spots" icon="✅" label="Approve Spots" desc="Review pending submissions" color="#d1fae5" />
                <QuickLink to="/admin/users" icon="👥" label="Manage Users" desc="View and delete users" color="#dbeafe" />
                <QuickLink to="/admin/bookings" icon="📋" label="All Bookings" desc="View system-wide bookings" color="#ede9fe" />
                <QuickLink to="/admin/locations" icon="📍" label="Locations" desc="Add and manage zones" color="#fef3c7" />
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e5f0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '16px', color: '#0f172a' }}>Pending Spot Approvals</h3>
              {!data.spots?.filter(s => s.approvalStatus === 'PENDING').length ? (
                <div className="empty-state" style={{ padding: '30px' }}><span className="icon">✅</span><p>All caught up! No pending approvals.</p></div>
              ) : (
                data.spots.filter(s => s.approvalStatus === 'PENDING').slice(0, 5).map(s => (
                  <div key={s.spotId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{s.spotName}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.address} · by {s.user?.name}</div>
                    </div>
                    <span className="badge badge-warning">PENDING</span>
                  </div>
                ))
              )}
              {data.spots?.filter(s => s.approvalStatus === 'PENDING').length > 5 && (
                <Link to="/admin/spots" style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: '12px' }}>
                  View all pending →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
