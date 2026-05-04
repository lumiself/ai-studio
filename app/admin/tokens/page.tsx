'use client';
import { useState, useEffect } from 'react';

interface UserRow {
  user_id: string;
  plan: string;
  balance: number;
  used: number;
  is_admin: boolean;
}

export default function TokensPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [plan, setPlan] = useState('');
  const [mode, setMode] = useState<'assign' | 'adjust'>('assign');
  const [status, setStatus] = useState('');

  const loadUsers = async () => {
    const res = await fetch('/api/admin/tokens');
    if (res.ok) {
      const { users } = await res.json();
      setUsers(users);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: Number(amount), plan: plan || undefined, mode }),
    });
    if (res.ok) {
      setStatus('Done');
      loadUsers();
      setUserId(''); setAmount(''); setPlan('');
    } else {
      const { error } = await res.json();
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="admin-page">
      <h1>Token Management</h1>

      <section className="admin-section">
        <h2>Assign / Adjust Tokens</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-field">
            <label>User ID (UUID)</label>
            <input value={userId} onChange={e => setUserId(e.target.value)} required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>
          <div className="admin-field">
            <label>Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as 'assign' | 'adjust')}>
              <option value="assign">Assign (set absolute balance)</option>
              <option value="adjust">Adjust (add/subtract delta)</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="100" />
          </div>
          <div className="admin-field">
            <label>Plan (optional)</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}>
              <option value="">— unchanged —</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          <button type="submit" className="admin-btn">Apply</button>
          {status && <p className="admin-status">{status}</p>}
        </form>
      </section>

      <section className="admin-section">
        <h2>All Users</h2>
        {loading ? <p>Loading…</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User ID</th><th>Plan</th><th>Balance</th><th>Used</th><th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id}>
                  <td><code>{u.user_id}</code></td>
                  <td>{u.plan}</td>
                  <td>{u.balance}</td>
                  <td>{u.used}</td>
                  <td>{u.is_admin ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
