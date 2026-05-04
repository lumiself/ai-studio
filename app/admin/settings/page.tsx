'use client';
import { useState, useEffect } from 'react';

const SETTING_LABELS: Record<string, string> = {
  replicate_api_key: 'Replicate API Key',
  model_remove_bg: 'Model: Remove BG (remove_bg)',
  model_replace_bg_step0: 'Model: Replace BG step 0 — remove bg (replace_bg)',
  model_replace_bg_step1: 'Model: Replace BG step 1 — generate background (replace_bg)',
  model_upscale: 'Model: Upscale (upscale)',
  model_gfpgan: 'Model: Face Restoration (gfpgan)',
  model_portrait_retouch_step0: 'Model: Portrait Retouch step 0 — gfpgan',
  model_portrait_retouch_step1: 'Model: Portrait Retouch step 1 — upscale',
  concurrency_limit: 'Max concurrent jobs',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(({ settings }) => {
      setSettings(settings ?? {});
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    setStatus(res.ok ? 'Saved' : 'Error saving settings');
  };

  if (loading) return <div className="admin-page"><p>Loading…</p></div>;

  return (
    <div className="admin-page">
      <h1>Settings</h1>
      <p className="admin-hint">
        Leave a model field blank to use the default version defined in the pipeline file.
        Model format: <code>owner/model:version-hash</code>
      </p>
      <form onSubmit={handleSave} className="admin-form">
        {Object.entries(SETTING_LABELS).map(([key, label]) => (
          <div key={key} className="admin-field">
            <label>{label}</label>
            <input
              type={key === 'replicate_api_key' ? 'password' : 'text'}
              value={settings[key] ?? ''}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
              placeholder={key === 'replicate_api_key' ? 'r8_••••••••' : 'Leave blank for default'}
            />
          </div>
        ))}
        <button type="submit" className="admin-btn">Save Settings</button>
        {status && <p className="admin-status">{status}</p>}
      </form>
    </div>
  );
}
