import React, { useEffect, useState, useMemo } from 'react';
import { getBookings } from '../services/api';
 
const parseLocal = (dtStr) => {
  if (!dtStr) return null;
  const hasTimezone = dtStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dtStr);
  if (hasTimezone) return new Date(dtStr);
  return new Date(dtStr + '+05:30');
};
 
const fmtTime = (dtStr) => {
  const d = parseLocal(dtStr);
  return d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';
};
 
const statusColor = (s) => {
  if (!s) return 'neutral';
  const sl = s.toLowerCase();
  if (sl.includes('confirm') || sl.includes('complete')) return 'success';
  if (sl.includes('pending') || sl.includes('hold') || sl.includes('block')) return 'warning';
  if (sl.includes('cancel')) return 'danger';
  return 'neutral';
};
 
const ITEMS_PER_PAGE = 10;
 
export default function AdminBookings() {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchUser, setSearchUser] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage]             = useState(1);
  const [sortField, setSortField]   = useState('bookingDate');
  const [sortDir, setSortDir]       = useState('desc');
 
  useEffect(() => {
    const load = async () => {
      try { setBookings(await getBookings()); } catch {}
      setLoading(false);
    };
    load();
  }, []);
 
  const statuses = ['ALL', 'CONFIRMED', 'COMPLETED', 'HOLD', 'CANCELLED', 'BLOCKED'];
 
  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...bookings];
    if (statusFilter !== 'ALL') list = list.filter(b => b.bookingStatus === statusFilter);
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      list = list.filter(b =>
        b.user?.name?.toLowerCase().includes(q) ||
        b.vehicle?.vehicleNo?.toLowerCase().includes(q) ||
        b.bookingCode?.toLowerCase().includes(q)
      );
    }
    if (dateFilter) list = list.filter(b => b.bookingDate === dateFilter);
 
    // Sort
    list.sort((a, b) => {
      let av = a[sortField] || '';
      let bv = b[sortField] || '';
      if (sortField === 'estimatedAmt' || sortField === 'finalAmt') {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [bookings, statusFilter, searchUser, dateFilter, sortField, sortDir]);
 
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
 
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
 
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);
 
 
 
  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: '4px', opacity: sortField === field ? 1 : 0.3, fontSize: '10px' }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '▲▼'}
    </span>
  );
 
  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;
 
  return (
    <div style={{ padding: '32px', maxWidth: '1300px', margin: '0 auto' }}>
 
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>All Bookings</h1>
          <p>{bookings.length} total · {filtered.length} shown · Click a row to expand details</p>
        </div>
 
      </div>
 
      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e5f0', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2, minWidth: '180px' }}>
          <label>Search user / vehicle / code</label>
          <input placeholder="e.g. Deva, KA01AB1234, BK123..." value={searchUser} onChange={e => { setSearchUser(e.target.value); setPage(1); }} />
        </div>
        <div className="form-group" style={{ minWidth: '150px' }}>
          <label>Filter by Date</label>
          <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearchUser(''); setDateFilter(''); setStatusFilter('ALL'); setPage(1); }}>Clear</button>
      </div>
 
      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {statuses.map(s => {
          const count = s === 'ALL' ? bookings.length : bookings.filter(b => b.bookingStatus === s).length;
          if (count === 0 && s !== 'ALL') return null;
          return (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
              borderColor: statusFilter === s ? '#4f46e5' : '#e2e5f0',
              background: statusFilter === s ? '#ede9fe' : '#fff',
              color: statusFilter === s ? '#4f46e5' : '#64748b',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {s} <span style={{ marginLeft: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', color: '#64748b' }}>{count}</span>
            </button>
          );
        })}
      </div>
 
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No bookings match your filters.</p></div>
      ) : (
        <>
          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e5f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1.5fr 1fr 1fr 1fr 0.4fr', gap: '0', background: '#f8fafc', borderBottom: '1px solid #e2e5f0', padding: '10px 20px' }}>
              {[
                { label: 'Booking', field: 'bookingCode' },
                { label: 'User', field: null },
                { label: 'Vehicle', field: null },
                { label: 'Date', field: 'bookingDate' },
                { label: 'Time', field: null },
                { label: 'Amount', field: 'estimatedAmt' },
                { label: 'Status', field: 'bookingStatus' },
                { label: 'Checkout', field: 'checkoutStatus' },
                { label: '', field: null },
              ].map((col, i) => (
                <div key={i} onClick={() => col.field && handleSort(col.field)}
                  style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', cursor: col.field ? 'pointer' : 'default', userSelect: 'none' }}>
                  {col.label}{col.field && <SortIcon field={col.field} />}
                </div>
              ))}
            </div>
 
            {/* Rows */}
            {paginated.map(b => {
              const isExpanded = expandedId === b.bookingId;
              const isBlocked  = b.bookingStatus === 'BLOCKED';
 
              return (
                <div key={b.bookingId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {/* Main row */}
                  <div
                    onClick={() => toggleExpand(b.bookingId)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1.5fr 1fr 1fr 1fr 0.4fr',
                      gap: '0', padding: '14px 20px', cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : '#fff',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#fafbff'; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: isBlocked ? '#92400e' : '#4f46e5' }}>
                        {b.bookingCode || `#${b.bookingId}`}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>ID #{b.bookingId}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', alignSelf: 'center' }}>
                      {b.user?.name || `User #${b.user?.userId}`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', alignSelf: 'center', fontFamily: 'monospace' }}>
                      {b.vehicle?.vehicleNo || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>
                      {b.bookingDate}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', alignSelf: 'center' }}>
                      {fmtTime(b.startTime)} → {fmtTime(b.endTime)}
                    </div>
                    <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '13px', alignSelf: 'center' }}>
                      ₹{b.finalAmt || b.estimatedAmt || '0'}
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <span className={`badge badge-${statusColor(b.bookingStatus)}`}>{b.bookingStatus}</span>
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <span className={`badge badge-${statusColor(b.checkoutStatus)}`}>{b.checkoutStatus || 'PENDING'}</span>
                    </div>
                    <div style={{ alignSelf: 'center', textAlign: 'center', color: '#94a3b8', fontSize: '14px', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  </div>
 
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px', background: '#f8fafc', borderTop: '1px solid #e2e5f0', animation: 'fadeIn 0.15s ease' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
 
                        {/* User Details */}
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e5f0' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>👤 User</div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>{b.user?.name || 'N/A'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{b.user?.email || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{b.user?.phoneNo || '—'}</div>
                        </div>
 
                        {/* Slot & Spot */}
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e5f0' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🅿️ Slot & Spot</div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>Slot #{b.slot?.slotNo || b.slot?.slotId}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{b.slot?.spot?.spotName || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{b.slot?.spot?.address || '—'}</div>
                        </div>
 
                        {/* Time Details */}
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e5f0' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🕐 Timing</div>
                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                            <span style={{ color: '#94a3b8' }}>Start:</span> {fmtTime(b.startTime)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                            <span style={{ color: '#94a3b8' }}>End:</span> {fmtTime(b.endTime)}
                          </div>
                          {b.checkoutTime && (
                            <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px' }}>
                              <span style={{ color: '#94a3b8' }}>Checkout:</span> {fmtTime(b.checkoutTime)}
                            </div>
                          )}
                          {b.cancellationTime && (
                            <div style={{ fontSize: '12px', color: '#ef4444' }}>
                              <span style={{ color: '#94a3b8' }}>Cancelled:</span> {fmtTime(b.cancellationTime)}
                            </div>
                          )}
                        </div>
 
                        {/* Payment Details */}
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e5f0' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>💰 Payment</div>
                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                            <span style={{ color: '#94a3b8' }}>Estimated:</span> ₹{b.estimatedAmt || '0'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                            <span style={{ color: '#94a3b8' }}>Initial Paid:</span> ₹{b.additionalFee || '0'}
                          </div>
                          {parseFloat(b.finalAmt || 0) > 0 && (
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                              Final: ₹{b.finalAmt}
                            </div>
                          )}
                          {b.cancellationReason && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontStyle: 'italic' }}>
                              ✗ {b.cancellationReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
 
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} bookings
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)} style={{
                      padding: '6px 12px', borderRadius: '8px', border: '1.5px solid',
                      borderColor: page === pageNum ? '#4f46e5' : '#e2e5f0',
                      background: page === pageNum ? '#4f46e5' : '#fff',
                      color: page === pageNum ? '#fff' : '#475569',
                      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px',
                      cursor: 'pointer',
                    }}>{pageNum}</button>
                  );
                })}
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next ›</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}