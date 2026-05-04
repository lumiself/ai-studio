import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { urls } = await req.json() as { urls: Array<{ filename: string; url: string }> };
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
  }

  if (urls.length > 200) {
    return NextResponse.json({ error: 'Too many files (max 200 per ZIP)' }, { status: 400 });
  }

  const zip = new JSZip();

  await Promise.all(
    urls.map(async ({ filename, url }) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        zip.file(filename, buf);
      } catch {
        // Skip files that fail to download; don't abort the whole ZIP.
      }
    }),
  );

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="ai-studio-results.zip"',
      'Content-Length': String(zipBuffer.length),
    },
  });
}
