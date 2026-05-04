import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { assignTokens, adjustBalance } from '@/lib/tokens';

async function requireAdmin(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createServiceSupabase();
  const { data } = await db.from('user_tokens').select('is_admin').eq('user_id', user.id).single();
  return data?.is_admin ? user : null;
}

// GET — list all users with token balances
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = createServiceSupabase();
  // Join user_tokens with auth.users via user_id.
  const { data, error } = await db
    .from('user_tokens')
    .select('user_id, plan, balance, used, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

// POST — assign or adjust token balance
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, amount, plan, mode } = await req.json() as {
    userId: string;
    amount: number;
    plan?: string;
    mode: 'assign' | 'adjust';
  };

  if (!userId || typeof amount !== 'number') {
    return NextResponse.json({ error: 'userId and amount required' }, { status: 400 });
  }

  if (mode === 'assign') {
    await assignTokens(userId, amount, plan);
  } else {
    await adjustBalance(userId, amount);
  }

  return NextResponse.json({ ok: true });
}
