import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser } from '../services/api';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNo: '', role: 'USER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const users = await getUsers();
      const user = users.find(u => u.email === form.email && u.password === form.password);
      if (!user) { setError('Invalid email or password. Please try again.'); setLoading(false); return; }
      login(user);
      navigate('/dashboard');
    } catch {
      setError('Cannot connect to server. Make sure backend is running on port 8080.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const newUser = await createUser({
        name: form.name, email: form.email,
        password: form.password, phoneNo: form.phoneNo, role: form.role,
      });
      login(newUser);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    }
    setLoading(false);
  };

  const roles = [
    { value: 'USER', label: 'User', desc: 'Find & book parking spots', icon: '🚗' },
    { value: 'SPOT_LENDER', label: 'Spot Lender', desc: 'List your parking space', icon: '🏢' },
    { value: 'PARKING_ADMIN', label: 'Admin', desc: 'Manage the platform', icon: '⚙️' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f2ff 0%, #faf5ff 50%, #fff0f6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '20px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 12px 32px rgba(79,70,229,0.35)',
            fontSize: '26px', fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-display)',
          }}>S</div>
          <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '4px' }}>SlotSpot</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Find Your Spot. Park Smart.</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: '24px',
          padding: '32px', boxShadow: '0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06)',
          border: '1px solid #e2e5f0',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: '#f8fafc',
            borderRadius: '10px', padding: '4px', marginBottom: '28px',
            border: '1px solid #e2e5f0',
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '9px',
                borderRadius: '8px', border: 'none',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0f172a' : '#94a3b8',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                boxShadow: mode === m ? '0 1px 4px rgba(15,23,42,0.1)' : 'none',
                transition: 'all 0.2s', cursor: 'pointer', textTransform: 'capitalize',
              }}>{m === 'login' ? 'Sign In' : 'Create Account'}</button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>

            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input name="phoneNo" placeholder="+91 9999999999" value={form.phoneNo} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>I want to</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                    {roles.map(r => (
                      <label key={r.value} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: `1.5px solid ${form.role === r.value ? '#4f46e5' : '#e2e5f0'}`,
                        background: form.role === r.value ? '#ede9fe' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={handleChange} style={{ width: 'auto', accentColor: '#4f46e5' }} />
                        <span style={{ fontSize: '18px' }}>{r.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{r.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{r.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
              transition: 'all 0.2s',
              opacity: loading ? 0.8 : 1,
              marginTop: '4px',
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
