// Sharp-based image compositing: blend a transparent foreground PNG
// onto a background image (any format). Returns a JPEG buffer.

import sharp from 'sharp';

export async function compositeImages(
  foregroundUrl: string, // transparent PNG (subject with no background)
  backgroundUrl: string, // background image (any size/format)
): Promise<Buffer> {
  const [fgRes, bgRes] = await Promise.all([
    fetch(foregroundUrl),
    fetch(backgroundUrl),
  ]);

  if (!fgRes.ok) throw new Error(`Failed to fetch foreground: ${fgRes.status}`);
  if (!bgRes.ok) throw new Error(`Failed to fetch background: ${bgRes.status}`);

  const [fgBuf, bgBuf] = await Promise.all([
    fgRes.arrayBuffer().then(Buffer.from),
    bgRes.arrayBuffer().then(Buffer.from),
  ]);

  // Get foreground dimensions so we can resize the background to match.
  const fgMeta = await sharp(fgBuf).metadata();
  const width  = fgMeta.width  ?? 1024;
  const height = fgMeta.height ?? 1024;

  // Resize background to cover the foreground canvas, then composite.
  const result = await sharp(bgBuf)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .composite([{ input: fgBuf, blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return result;
}
