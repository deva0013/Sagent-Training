import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import MyBookingsPage from './pages/MyBookingsPage';
import VehiclesPage from './pages/VehiclesPage';
import WalletPage from './pages/WalletPage';
import MySpots from './pages/MySpots';
import LenderBookings from './pages/LenderBookings';
import AdminSpots from './pages/AdminSpots';
import AdminUsers from './pages/AdminUsers';
import AdminBookings from './pages/AdminBookings';
import AdminLocations from './pages/AdminLocations';
import './index.css';
 
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <Navigate to="/dashboard" />;
  return children;
};
 
function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
 
        {/* Shared */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/search" element={<SearchPage />} />
 
        {/* User */}
        <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['USER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['USER']}><VehiclesPage /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute allowedRoles={['USER']}><WalletPage /></ProtectedRoute>} />
 
        {/* Lender Wallet */}
        <Route path="/lender/wallet" element={<ProtectedRoute allowedRoles={['SPOT_LENDER']}><WalletPage /></ProtectedRoute>} />
 
        {/* Admin Wallet */}
        <Route path="/admin/wallet" element={<ProtectedRoute allowedRoles={['PARKING_ADMIN']}><WalletPage /></ProtectedRoute>} />
 
        {/* Spot Lender */}
        <Route path="/my-spots" element={<ProtectedRoute allowedRoles={['SPOT_LENDER']}><MySpots /></ProtectedRoute>} />
        <Route path="/lender-bookings" element={<ProtectedRoute allowedRoles={['SPOT_LENDER']}><LenderBookings /></ProtectedRoute>} />
 
        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['PARKING_ADMIN']}><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/spots" element={<ProtectedRoute allowedRoles={['PARKING_ADMIN']}><AdminSpots /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['PARKING_ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['PARKING_ADMIN']}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/locations" element={<ProtectedRoute allowedRoles={['PARKING_ADMIN']}><AdminLocations /></ProtectedRoute>} />
 
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
 
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}