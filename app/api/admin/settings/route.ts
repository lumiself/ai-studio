import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase';
import { invalidateReplicateClient } from '@/lib/replicate';

async function requireAdmin(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createServiceSupabase();
  const { data } = await db.from('user_tokens').select('is_admin').eq('user_id', user.id).single();
  return data?.is_admin ? user : null;
}

// GET — load all settings
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = createServiceSupabase();
  const { data, error } = await db.from('settings').select('key, value');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings = Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
  return NextResponse.json({ settings });
}

// POST — save one or more settings
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { settings } = await req.json() as { settings: Record<string, string> };
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'settings object required' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
  const { error } = await db.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate cached Replicate client if API key changed.
  if ('replicate_api_key' in settings) invalidateReplicateClient();

  return NextResponse.json({ ok: true });
}
