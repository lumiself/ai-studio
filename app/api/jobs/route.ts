import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';

// Browser polls this every 4 seconds for active job statuses.
// Never polls Replicate — only reads the Supabase jobs table.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ids = req.nextUrl.searchParams.get('ids');
  if (!ids) return NextResponse.json({ jobs: [] });

  const jobIds = ids.split(',').filter(Boolean).slice(0, 50); // cap at 50 per poll

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('jobs')
    .select('id, status, output_url, error')
    .eq('user_id', user.id)
    .in('id', jobIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ jobs: data ?? [] });
}
