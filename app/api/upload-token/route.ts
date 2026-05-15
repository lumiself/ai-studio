import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = process.env.STORAGE_SECRET_TOKEN!;
  const uploadUrl = process.env.STORAGE_UPLOAD_URL!;
  const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes
  const hmac = createHmac('sha256', secret).update(`upload:${expiresAt}`).digest('hex');

  return NextResponse.json({ token: `${expiresAt}:${hmac}`, uploadUrl });
}
