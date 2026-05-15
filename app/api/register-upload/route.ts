import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createServerSupabase } from '@/lib/supabase/server';
import { uploadToStorage, thumbFilename } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId, inputUrl } = await req.json() as { jobId: string; inputUrl: string };
  if (!jobId || !inputUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const storageBase = process.env.STORAGE_BASE_URL!;
  if (!inputUrl.startsWith(storageBase)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  let thumbUrl: string | undefined;
  try {
    const imageRes = await fetch(inputUrl);
    if (imageRes.ok) {
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      const thumbBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
      thumbUrl = await uploadToStorage(thumbBuffer, thumbFilename(jobId), 'uploads');
    }
  } catch {
    // thumbnail is non-fatal
  }

  return NextResponse.json({ thumbUrl });
}
