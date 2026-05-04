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

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', category: '', bg_prompt: '', thumbnail_url: '' });
  const [status, setStatus] = useState('');

  const loadPresets = async () => {
    const res = await fetch('/api/presets');
    if (res.ok) { const { presets } = await res.json(); setPresets(presets); }
    setLoading(false);
  };

  useEffect(() => { loadPresets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setStatus('Preset created');
      setForm({ name: '', description: '', category: '', bg_prompt: '', thumbnail_url: '' });
      loadPresets();
    } else {
      const { error } = await res.json();
      setStatus(`Error: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/presets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadPresets();
  };

  return (
    <div className="admin-page">
      <h1>Preset Builder</h1>

      <section className="admin-section">
        <h2>Create Preset</h2>
        <form onSubmit={handleCreate} className="admin-form">
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
          <button type="submit" className="admin-btn">Create Preset</button>
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
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td><small>{p.bg_prompt.slice(0, 60)}{p.bg_prompt.length > 60 ? '…' : ''}</small></td>
                  <td>
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
