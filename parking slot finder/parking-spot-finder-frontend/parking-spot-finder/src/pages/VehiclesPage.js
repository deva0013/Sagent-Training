import React, { useEffect, useState } from 'react';
import { getVehicles, createVehicle } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VehiclesPage() {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vehicleNo: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const all = await getVehicles();
      setVehicles(all.filter(v => v.user?.userId === currentUser.userId));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await createVehicle({ vehicleNo: form.vehicleNo, user: { userId: currentUser.userId } });
      setSuccess('Vehicle added successfully!');
      setShowModal(false);
      setForm({ vehicleNo: '' });
      load();
    } catch { setError('Failed to add vehicle. Number plate may already exist.'); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>My Vehicles</h1>
          <p>Manage your registered vehicles</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>+ Add Vehicle</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🚗</div>
          <p>No vehicles registered yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>Add Your First Vehicle</button>
        </div>
      ) : (
        <div className="grid-2">
          {vehicles.map(v => (
            <div key={v.vehicleId} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
              }}>🚗</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px' }}>
                  {v.vehicleNo}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>Vehicle ID: #{v.vehicleId}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2>Add New Vehicle</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Vehicle Number Plate</label>
                <input
                  placeholder="e.g. TN09AB1234"
                  value={form.vehicleNo}
                  onChange={e => setForm({ vehicleNo: e.target.value.toUpperCase() })}
                  required style={{ textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace', fontSize: '16px' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
