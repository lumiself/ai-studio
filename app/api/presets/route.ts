import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase';

// GET — list all custom presets (authenticated users)
export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('custom_presets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ presets: data ?? [] });
}

// POST — create a custom preset (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceSupabase();
  const { data: tokenRow } = await db.from('user_tokens').select('is_admin').eq('user_id', user.id).single();
  if (!tokenRow?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, description, category, thumbnail_url, bg_prompt, inputs } = body;
  if (!name || !category) return NextResponse.json({ error: 'name and category required' }, { status: 400 });

  const { data, error } = await db.from('custom_presets').insert({
    name, description: description ?? '', category,
    thumbnail_url: thumbnail_url ?? null,
    bg_prompt: bg_prompt ?? '',
    inputs: inputs ?? [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preset: data }, { status: 201 });
}

// DELETE — remove a custom preset (admin only)
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceSupabase();
  const { data: tokenRow } = await db.from('user_tokens').select('is_admin').eq('user_id', user.id).single();
  if (!tokenRow?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await db.from('custom_presets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
