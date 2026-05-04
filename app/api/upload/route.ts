import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { uploadToStorage, uploadFilename } from '@/lib/storage';

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

  const inputUrl = await uploadToStorage(buffer, filename, 'uploads');

  return NextResponse.json({ jobId, inputUrl });
}
