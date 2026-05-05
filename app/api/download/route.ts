import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import JSZip from 'jszip';

// Single-file proxy download — browser follows <a href="/api/download?url=...">
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') ?? 'result.png';
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const upstream = await fetch(url);
  if (!upstream.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });

  const buffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') ?? 'image/png';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}

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

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="ai-studio-results.zip"',
      'Content-Length': String(zipBuffer.byteLength),
    },
  });
}
