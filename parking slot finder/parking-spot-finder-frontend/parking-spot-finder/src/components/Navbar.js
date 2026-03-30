import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
 
const navLinks = {
  USER: [
    { to: '/dashboard',   label: 'Dashboard',   icon: '⊞' },
    { to: '/search',      label: 'Find Parking', icon: '⊙' },
    { to: '/my-bookings', label: 'My Bookings',  icon: '⊟' },
    { to: '/vehicles',    label: 'Vehicles',     icon: '⊠' },
    { to: '/wallet',      label: 'Wallet',       icon: '⊛' },
  ],
  SPOT_LENDER: [
    { to: '/dashboard',       label: 'Dashboard', icon: '⊞' },
    { to: '/my-spots',        label: 'My Spots',  icon: '⊙' },
    { to: '/lender-bookings', label: 'Bookings',  icon: '⊟' },
    { to: '/lender/wallet',   label: 'Wallet',    icon: '⊛' },
  ],
  PARKING_ADMIN: [
    { to: '/admin',           label: 'Dashboard',     icon: '⊞' },
    { to: '/admin/spots',     label: 'Manage Spots',  icon: '⊙' },
    { to: '/admin/users',     label: 'Users',         icon: '⊠' },
    { to: '/admin/bookings',  label: 'Bookings',      icon: '⊟' },
    { to: '/admin/locations', label: 'Locations',     icon: '⊛' },
    { to: '/admin/wallet',    label: 'Wallet',        icon: '💰' },
  ],
};
 
 
 
export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  if (!currentUser) return null;
 
  const links = navLinks[currentUser.role] || [];
 
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
 
  return (
    <nav style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e5f0',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 32px',
      display: 'flex', alignItems: 'center',
      height: '64px', gap: '8px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px', textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 800, color: '#fff',
          fontFamily: 'var(--font-display)',
          boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
        }}>S</div>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: '17px', color: '#0f172a', letterSpacing: '-0.3px',
        }}>SlotSpot</span>
      </Link>
 
      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {links.map(link => {
          const active = location.pathname === link.to || (link.to !== '/dashboard' && link.to !== '/admin' && location.pathname.startsWith(link.to));
          return (
            <Link key={link.to} to={link.to} style={{
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px', fontWeight: active ? 600 : 500,
              color: active ? '#4f46e5' : '#64748b',
              background: active ? '#ede9fe' : 'transparent',
              transition: 'all 0.15s',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
 
      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
 
        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '13px', color: '#fff',
            boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          }}>{currentUser.name?.[0]?.toUpperCase()}</div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            {currentUser.name?.split(' ')[0]}
          </span>
        </div>
 
        {/* Logout */}
        <button onClick={handleLogout} style={{
          padding: '7px 16px', borderRadius: '8px',
          background: 'transparent', border: '1.5px solid #e2e5f0',
          fontSize: '13px', fontWeight: 600, color: '#64748b',
          cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'var(--font-display)',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e5f0'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}