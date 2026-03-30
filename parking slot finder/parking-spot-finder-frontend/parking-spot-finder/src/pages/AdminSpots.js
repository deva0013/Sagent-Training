import React, { useEffect, useState } from 'react';
import { getParkingSpots, updateParkingSpot } from '../services/api';

const statusColor = (s) => {
  if (s === 'APPROVED') return 'success';
  if (s === 'PENDING')  return 'warning';
  if (s === 'REJECTED') return 'danger';
  return 'neutral';
};

export default function AdminSpots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [actionModal, setActionModal] = useState(null); // { spot, action: 'approve'|'reject' }
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceModal, setPriceModal] = useState(null); // { spot }
  const [newPrice, setNewPrice] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const s = await getParkingSpots();
      setSpots(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpdatePrice = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) { setError('Enter a valid price.'); return; }
    setSaving(true);
    const spot = priceModal.spot;
    const updatedSpot = { ...spot, pricePerHr: parseFloat(newPrice).toFixed(2) };
    try {
      const res = await fetch(`http://localhost:8080/spots/${spot.spotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSpot),
      });
      if (res.ok) {
        setSpots(prev => prev.map(s => s.spotId === spot.spotId ? { ...s, pricePerHr: newPrice } : s));
        setSuccess(`Price for "${spot.spotName}" updated to ₹${newPrice}/hr. Affects new bookings only.`);
      } else {
        setError('Update failed. Add PUT /spots/{id} to your backend.');
      }
    } catch { setError('Update failed. Make sure backend is running.'); }
    setPriceModal(null);
    setNewPrice('');
    setSaving(false);
  };

  const handleAction = async (action) => {
    setSaving(true); setError('');
    const spot = actionModal.spot;
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedSpot = {
      ...spot,
      approvalStatus: newStatus,
      approvalReason: action === 'reject' ? (reason || 'Does not meet requirements') : 'Verified and approved',
      approvalTime: new Date().toISOString(),
    };

    try {
      // Try PUT endpoint
      await updateParkingSpot(spot.spotId, updatedSpot);
      // Update local state immediately
      setSpots(prev => prev.map(s => s.spotId === spot.spotId ? { ...s, approvalStatus: newStatus, approvalReason: updatedSpot.approvalReason } : s));
      setSuccess(`Spot "${spot.spotName}" has been ${newStatus.toLowerCase()} successfully!`);
      setActionModal(null);
      setReason('');
    } catch {
      // PUT not added yet — update locally only (UI reflects change, DB won't until PUT is added)
      setSpots(prev => prev.map(s => s.spotId === spot.spotId
        ? { ...s, approvalStatus: newStatus, approvalReason: updatedSpot.approvalReason }
        : s
      ));
      setSuccess(`Spot "${spot.spotName}" marked as ${newStatus} in UI. Add PUT /spots/{id} to your backend to persist.`);
      setActionModal(null);
      setReason('');
    }
    setSaving(false);
  };

  const filtered = filter === 'ALL' ? spots : spots.filter(s => s.approvalStatus === filter);

  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Manage Parking Spots</h1>
        <p>Review, approve or reject spot submissions</p>
      </div>

      {success && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: '20px', border: '1.5px solid',
            borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
            background: filter === f ? 'rgba(108,99,255,0.1)' : 'transparent',
            color: filter === f ? 'var(--accent)' : 'var(--text2)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
          }}>
            {f}
            <span style={{ marginLeft: '6px', background: 'var(--bg3)', borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>
              {f === 'ALL' ? spots.length : spots.filter(s => s.approvalStatus === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">✅</div><p>No spots in this category</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Spot Name</th><th>Lender</th><th>Address</th><th>Price/Hr</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.spotId}>
                  <td>#{s.spotId}</td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{s.spotName}</td>
                  <td>{s.user?.name || `User #${s.user?.userId}`}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: 600 }}>₹{s.pricePerHr}</td>
                  <td>
                    <span className={`badge badge-${statusColor(s.approvalStatus)}`}>{s.approvalStatus}</span>
                    {s.approvalReason && s.approvalStatus === 'REJECTED' && (
                      <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '3px' }}>{s.approvalReason}</div>
                    )}
                  </td>
                  <td>
                    {s.approvalStatus === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => { setActionModal({ spot: s, action: 'approve' }); setReason(''); setError(''); }}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { setActionModal({ spot: s, action: 'reject' }); setReason(''); setError(''); }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
                        {s.approvalStatus === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Price Modal */}
      {priceModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPriceModal(null); }}>
          <div className="modal" style={{ maxWidth: '420px' }}>
            <h2 style={{ marginBottom: '6px' }}>✏️ Update Pricing</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              New price affects only new reservations, not existing bookings.
            </p>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #e2e5f0' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{priceModal.spot.spotName}</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{priceModal.spot.address}</div>
              <div style={{ color: '#f59e0b', fontWeight: 700, marginTop: '6px' }}>Current: ₹{priceModal.spot.pricePerHr}/hr</div>
            </div>

            {/* Dynamic pricing suggestion */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>💡 Dynamic Pricing Tips</div>
              <div>• Peak hours (8-10AM, 5-8PM): charge 20-30% more</div>
              <div>• Night hours (10PM-6AM): offer 15-20% discount</div>
              <div>• High demand area: premium rates justified</div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>New Price per Hour (₹)</label>
              <input
                type="number" step="0.01" min="1"
                placeholder="e.g. 75"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setPriceModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdatePrice} disabled={saving}>
                {saving ? 'Updating...' : 'Update Price'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setActionModal(null); }}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <h2 style={{ marginBottom: '6px' }}>
              {actionModal.action === 'approve' ? '✅ Approve Spot' : '❌ Reject Spot'}
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
              {actionModal.action === 'approve'
                ? 'This spot will become active and visible to users.'
                : 'The lender will be notified with the rejection reason.'}
            </p>

            {/* Spot Info */}
            <div style={{ background: 'var(--bg3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>{actionModal.spot.spotName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>ADDRESS</div>
                  <div style={{ color: 'var(--text2)' }}>{actionModal.spot.address}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>PRICE/HR</div>
                  <div style={{ color: 'var(--warning)', fontWeight: 600 }}>₹{actionModal.spot.pricePerHr}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>SUBMITTED BY</div>
                  <div style={{ color: 'var(--text2)' }}>{actionModal.spot.user?.name || `User #${actionModal.spot.user?.userId}`}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', fontSize: '11px' }}>LOCATION</div>
                  <div style={{ color: 'var(--text2)' }}>{actionModal.spot.location?.areaName || '—'}, {actionModal.spot.location?.city || '—'}</div>
                </div>
              </div>
            </div>

            {/* Rejection reason */}
            {actionModal.action === 'reject' && (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Rejection Reason</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Location not verified, incomplete details..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={actionModal.action === 'approve' ? 'btn btn-success' : 'btn btn-danger'}
                onClick={() => handleAction(actionModal.action)}
                disabled={saving}
              >
                {saving ? 'Processing...' : actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
