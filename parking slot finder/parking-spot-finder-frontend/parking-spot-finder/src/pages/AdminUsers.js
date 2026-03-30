import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../services/api';

const roleColor = (r) => {
  if (r === 'PARKING_ADMIN') return 'danger';
  if (r === 'SPOT_LENDER') return 'info';
  if (r === 'USER') return 'success';
  return 'neutral';
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try { setUsers(await getUsers()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    setDeleting(id);
    try {
      await deleteUser(id);
      setSuccess('User deleted.');
      load();
    } catch {}
    setDeleting(null);
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Manage Users</h1>
          <p>{users.length} registered users</p>
        </div>
        <input style={{ width: '240px' }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.userId}>
                <td>#{u.userId}</td>
                <td style={{ color: 'var(--text)', fontWeight: 500 }}>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phoneNo || '—'}</td>
                <td><span className={`badge badge-${roleColor(u.role)}`}>{u.role?.replace('_', ' ')}</span></td>
                <td>
                  {u.role === 'PARKING_ADMIN' ? (
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>—</span>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.userId)} disabled={deleting === u.userId}>
                      {deleting === u.userId ? '...' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
