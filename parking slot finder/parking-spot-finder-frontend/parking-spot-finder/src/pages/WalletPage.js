import React, { useEffect, useState } from 'react';
import { getWallets, createWallet, getTransactions, createTransaction, updateWallet } from '../services/api';
import { useAuth } from '../context/AuthContext';
 
const formatDateTime = (isoString) => {
  if (!isoString) return '--';
  try {
    let str = isoString;
    if (!str.includes('Z') && !str.includes('+') && !str.slice(10).includes('-')) str = str + '+05:30';
    return new Date(str).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    });
  } catch { return '--'; }
};
 
export default function WalletPage() {
  const { currentUser } = useAuth();
  const [wallet, setWallet]             = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [topupAmt, setTopupAmt]         = useState('');
  const [saving, setSaving]             = useState(false);
  const [success, setSuccess]           = useState('');
  const [error, setError]               = useState('');
 
  const isLender = currentUser?.role === 'SPOT_LENDER';
  const isAdmin  = currentUser?.role === 'PARKING_ADMIN';
  const isUser   = currentUser?.role === 'USER';
 
  const load = async () => {
    setLoading(true);
    try {
      const [wallets, txns] = await Promise.all([getWallets(), getTransactions()]);
      const mine = wallets.find(w => w.user?.userId === currentUser.userId);
      setWallet(mine || null);
      const myTxns = txns
        .filter(t => t.wallet?.walletId === mine?.walletId)
        .sort((a, b) => new Date(b.transactionTime || 0) - new Date(a.transactionTime || 0));
      setTransactions(myTxns);
    } catch {}
    setLoading(false);
  };
 
  useEffect(() => { load(); }, [currentUser]);
 
  const handleCreateWallet = async () => {
    setSaving(true); setError('');
    try {
      const w = await createWallet({ user: { userId: currentUser.userId }, balance: 0, lastUpdated: new Date().toISOString() });
      setWallet(w);
      setSuccess('Wallet created successfully!');
    } catch { setError('Failed to create wallet.'); }
    setSaving(false);
  };
 
  const handleTopUp = async () => {
    const amt = parseFloat(topupAmt);
    if (!amt || amt <= 0) { setError('Please enter a valid amount'); return; }
    if (amt > 10000) { setError('Maximum top-up per transaction is Rs.10,000'); return; }
    setSaving(true); setError('');
    try {
      const newBalance = parseFloat((parseFloat(wallet.balance || 0) + amt).toFixed(2));
      const updatedPayload = { ...wallet, balance: newBalance.toFixed(2), lastUpdated: new Date().toISOString() };
      let savedWallet = null;
      try { savedWallet = await updateWallet(wallet.walletId, updatedPayload); } catch {}
      setWallet(savedWallet || updatedPayload);
      await createTransaction({
        wallet: { walletId: wallet.walletId }, amount: amt.toFixed(2),
        transactionType: 'CREDIT', purpose: 'WALLET_TOPUP',
        transactionStatus: 'SUCCESS', transactionTime: new Date().toISOString(),
      });
      setSuccess('Rs.' + amt.toFixed(2) + ' added to your wallet!');
      setTopupAmt('');
      load();
    } catch { setError('Top-up failed. Please try again.'); }
    setSaving(false);
  };
 
  const txColor = (type) => type === 'CREDIT' ? 'success' : type === 'DEBIT' ? 'danger' : 'neutral';
 
  const purposeLabel = (purpose) => ({
    WALLET_TOPUP:      'Top Up',
    BOOKING_PAYMENT:   'Booking',
    INITIAL_PAYMENT:   'Initial Pay',
    REMAINING_PAYMENT: 'Remaining Pay',
    LATE_FEE:          'Late Fee',
    BOOKING_REFUND:    'Refund',
    SLOT_EARNING:      'Slot Earning',
    COMMISSION:        'Commission',
    LATE_FEE_REVENUE:  'Late Fee Revenue',
  }[purpose] || purpose || '--');
 
  const totalEarned  = transactions.filter(t => t.transactionType === 'CREDIT').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const slotEarnings = transactions.filter(t => t.purpose === 'SLOT_EARNING').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const commissions  = transactions.filter(t => ['COMMISSION','LATE_FEE_REVENUE'].includes(t.purpose)).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.transactionTime);
    return t.transactionType === 'CREDIT' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
 
  const cardGradient = isAdmin  ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'
                     : isLender ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                     :            'linear-gradient(135deg, #4f46e5 0%, #9b59b6 100%)';
  const cardShadow   = isAdmin  ? '0 8px 40px rgba(15,23,42,0.4)'
                     : isLender ? '0 8px 40px rgba(4,120,87,0.4)'
                     :            '0 8px 40px rgba(108,99,255,0.4)';
  const pageTitle    = isAdmin  ? 'Admin Earnings Wallet' : isLender ? 'Lender Earnings Wallet' : 'My Wallet';
  const pageSubtitle = isAdmin  ? 'Platform commission and late fee revenue'
                     : isLender ? 'Your slot rental earnings'
                     :            'Manage your parking wallet balance';
 
  if (loading) return <div style={{ padding: 40 }}><div className="loader" /></div>;
 
  return (
    <div style={{ padding: '32px', maxWidth: '860px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <p>{pageSubtitle}</p>
      </div>
 
      {success && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>x</button>
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>x</button>
        </div>
      )}
 
      {!wallet ? (
        <div className="empty-state">
          <div className="icon">&#x1F4B3;</div>
          <p>{isLender ? 'Create your earnings wallet to start receiving slot payments.'
             : isAdmin  ? 'Create admin wallet to receive platform commission.'
             :            "You don't have a wallet yet."}</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={handleCreateWallet} disabled={saving}>
            {saving ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      ) : (
        <>
          {/* Balance card */}
          <div style={{ background: cardGradient, borderRadius: '20px', padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden', boxShadow: cardShadow, color: '#fff' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', bottom: -60, right: 40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7, marginBottom: '6px' }}>
              {isAdmin ? 'Commission Balance' : isLender ? 'Earnings Balance' : 'Available Balance'}
            </div>
            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '8px' }}>
              Rs.{parseFloat(wallet.balance || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>Wallet ID: #{wallet.walletId} &middot; {currentUser.name}</div>
          </div>
 
          {/* Earnings summary - Lender and Admin only */}
          {(isLender || isAdmin) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Total Earned</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-display)' }}>Rs.{totalEarned.toFixed(2)}</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px' }}>All time credits</div>
              </div>
 
              {isLender ? (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Slot Earnings</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1d4ed8', fontFamily: 'var(--font-display)' }}>Rs.{slotEarnings.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px' }}>90% of each booking</div>
                </div>
              ) : (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '18px 20px' }}>
                  <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Commission + Fines</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1d4ed8', fontFamily: 'var(--font-display)' }}>Rs.{commissions.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px' }}>10% per booking + late fees</div>
                </div>
              )}
 
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ fontSize: '10px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>This Month</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#b45309', fontFamily: 'var(--font-display)' }}>Rs.{thisMonth.toFixed(2)}</div>
                <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px' }}>{now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          )}
 
 
 
          {/* Top-Up - USER only */}
          {isUser && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '6px', fontSize: '1rem' }}>Add Money</h3>
              <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>Add money to pay for parking bookings.</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {[100, 200, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setTopupAmt(String(amt))} style={{
                    padding: '8px 18px', borderRadius: '10px',
                    border: '1.5px solid ' + (topupAmt === String(amt) ? 'var(--accent)' : 'var(--border)'),
                    background: topupAmt === String(amt) ? 'rgba(108,99,255,0.12)' : 'var(--bg3)',
                    color: topupAmt === String(amt) ? 'var(--accent)' : 'var(--text2)',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                  }}>Rs.{amt}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Custom Amount (Rs.)</label>
                  <input type="number" placeholder="Enter amount" value={topupAmt} onChange={e => setTopupAmt(e.target.value)} min="1" max="10000" />
                </div>
                <button className="btn btn-success" onClick={handleTopUp} disabled={saving || !topupAmt} style={{ whiteSpace: 'nowrap', marginBottom: '1px' }}>
                  {saving ? 'Processing...' : '+ Add Money'}
                </button>
              </div>
            </div>
          )}
 
          {/* Transaction History */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem' }}>Transaction History</h3>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{transactions.length} transactions</span>
            </div>
 
            {transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <div className="icon">&#x1F4C4;</div>
                <p>{isLender ? 'No earnings yet. Appears here when users book your slots.'
                   : isAdmin  ? 'No commission yet. Credited automatically on bookings.'
                   :            'No transactions yet.'}</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Type</th><th>Amount</th><th>Purpose</th><th>Status</th><th>Date &amp; Time</th></tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, index) => (
                      <tr key={t.transactionId}>
                        <td style={{ color: 'var(--text3)' }}>#{index + 1}</td>
                        <td><span className={'badge badge-' + txColor(t.transactionType)}>{t.transactionType}</span></td>
                        <td style={{ color: t.transactionType === 'CREDIT' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                          {t.transactionType === 'CREDIT' ? '+' : '-'}Rs.{t.amount}
                        </td>
                        <td style={{ fontSize: '13px' }}>{purposeLabel(t.purpose)}</td>
                        <td><span className={'badge badge-' + (t.transactionStatus === 'SUCCESS' ? 'success' : 'neutral')}>{t.transactionStatus}</span></td>
                        <td style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{formatDateTime(t.transactionTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
 