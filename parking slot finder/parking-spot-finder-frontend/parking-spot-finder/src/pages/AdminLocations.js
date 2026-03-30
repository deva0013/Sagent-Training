import React, { useEffect, useState } from 'react';
import { getLocations, createLocation } from '../services/api';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ areaName: '', city: '', pincode: '', latitude: '', longitude: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try { setLocations(await getLocations()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createLocation({
        areaName: form.areaName, city: form.city, pincode: form.pincode,
        latitude: parseFloat(form.latitude) || null,
        longitude: parseFloat(form.longitude) || null,
      });
      setSuccess('Location added!');
      setShowModal(false);
      setForm({ areaName: '', city: '', pincode: '', latitude: '', longitude: '' });
      load();
    } catch { setError('Failed to add location.'); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Manage Locations</h1>
          <p>Add and view location zones</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>+ Add Location</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {locations.length === 0 ? (
        <div className="empty-state"><div className="icon">📍</div><p>No locations yet.</p></div>
      ) : (
        <div className="grid-3">
          {locations.map(l => (
            <div key={l.locationId} className="card">
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📍</div>
              <h3 style={{ fontSize: '1rem' }}>{l.areaName}</h3>
              <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>{l.city}</p>
              <p style={{ color: 'var(--text3)', fontSize: '12px' }}>PIN: {l.pincode}</p>
              {l.latitude && <p style={{ color: 'var(--text3)', fontSize: '11px', marginTop: '6px' }}>
                {l.latitude.toFixed(4)}, {l.longitude.toFixed(4)}
              </p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h2>Add New Location</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Area Name</label>
                <input placeholder="e.g. Guindy" value={form.areaName} onChange={e => setForm(p => ({ ...p, areaName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>City</label>
                <input placeholder="e.g. Chennai" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input placeholder="e.g. 600032" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Latitude</label>
                  <input type="number" step="any" placeholder="12.9716" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input type="number" step="any" placeholder="80.2209" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Location'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
