import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createServerSupabase } from '@/lib/supabase/server';
import { uploadToStorage, uploadFilename, thumbFilename } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const maxBytes = 20 * 1024 * 1024; // 20 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
  }

  const jobId = crypto.randomUUID();
  const filename = uploadFilename(jobId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  const thumbBuffer = await sharp(buffer)
    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  let inputUrl: string;
  try {
    inputUrl = await uploadToStorage(buffer, filename, 'uploads');
  } catch (err) {
    console.error('Storage upload failed:', err);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  let thumbUrl: string | undefined;
  try {
    thumbUrl = await uploadToStorage(thumbBuffer, thumbFilename(jobId), 'uploads');
  } catch (err) {
    console.error('Thumbnail upload failed (non-fatal):', err);
  }

  return NextResponse.json({ jobId, inputUrl, thumbUrl });
}
