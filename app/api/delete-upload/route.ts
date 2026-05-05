import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { deleteFromStorage } from '@/lib/storage';

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inputUrl } = await req.json() as { inputUrl?: string };
  if (!inputUrl) return NextResponse.json({ error: 'Missing inputUrl' }, { status: 400 });

  const db = createServiceSupabase();

  // Verify ownership before deleting
  const { data } = await db
    .from('jobs')
    .select('id')
    .eq('user_id', user.id)
    .eq('input_url', inputUrl)
    .limit(1)
    .single();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteFromStorage(inputUrl);

  // Remove all jobs that used this input so they don't appear in history
  await db.from('jobs').delete().eq('user_id', user.id).eq('input_url', inputUrl);

  return NextResponse.json({ ok: true });
}
