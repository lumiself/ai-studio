'use client';
import { useState, useEffect } from 'react';

interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  bg_prompt: string;
}

const EMPTY_FORM = { name: '', description: '', category: '', bg_prompt: '', thumbnail_url: '' };

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const loadPresets = async () => {
    const res = await fetch('/api/presets');
    if (res.ok) { const { presets } = await res.json(); setPresets(presets); }
    setLoading(false);
  };

  useEffect(() => { loadPresets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    if (editingId) {
      const res = await fetch('/api/presets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      if (res.ok) {
        setStatus('Preset updated');
        setForm(EMPTY_FORM);
        setEditingId(null);
        loadPresets();
      } else {
        const { error } = await res.json();
        setStatus(`Error: ${error}`);
      }
    } else {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('Preset created');
        setForm(EMPTY_FORM);
        loadPresets();
      } else {
        const { error } = await res.json();
        setStatus(`Error: ${error}`);
      }
    }
  };

  const handleEdit = (p: Preset) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description, category: p.category, bg_prompt: p.bg_prompt, thumbnail_url: p.thumbnail_url ?? '' });
    setStatus('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStatus('');
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/presets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      if (editingId === id) { setEditingId(null); setForm(EMPTY_FORM); }
      loadPresets();
    }
  };

  return (
    <div className="admin-page">
      <h1>Preset Builder</h1>

      <section className="admin-section">
        <h2>{editingId ? 'Edit Preset' : 'Create Preset'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          {([
            ['name', 'Name', 'e.g. Golden Hour'],
            ['category', 'Category', 'e.g. Outdoor'],
            ['description', 'Description', 'Short description for tooltip'],
            ['bg_prompt', 'Background Prompt', 'e.g. warm golden hour outdoor background with soft bokeh'],
            ['thumbnail_url', 'Thumbnail URL (optional)', 'https://…'],
          ] as [string, string, string][]).map(([key, label, ph]) => (
            <div key={key} className="admin-field">
              <label>{label}</label>
              <input
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={ph}
                required={key !== 'thumbnail_url'}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="admin-btn">{editingId ? 'Update Preset' : 'Create Preset'}</button>
            {editingId && <button type="button" className="admin-btn" onClick={handleCancelEdit}>Cancel</button>}
          </div>
          {status && <p className="admin-status">{status}</p>}
        </form>
      </section>

      <section className="admin-section">
        <h2>Custom Presets</h2>
        {loading ? <p>Loading…</p> : presets.length === 0 ? <p>No custom presets yet.</p> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Category</th><th>Prompt</th><th></th></tr></thead>
            <tbody>
              {presets.map(p => (
                <tr key={p.id} style={editingId === p.id ? { background: 'rgba(99,102,241,0.08)' } : undefined}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td><small>{p.bg_prompt.slice(0, 60)}{p.bg_prompt.length > 60 ? '…' : ''}</small></td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <button className="admin-btn" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
