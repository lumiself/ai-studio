// Uploads a file buffer to shared hosting via the PHP upload script.
// Returns the public URL of the saved file.

const UPLOAD_URL = process.env.STORAGE_UPLOAD_URL!;
const SECRET_TOKEN = process.env.STORAGE_SECRET_TOKEN!;

export type StorageFolder = 'uploads' | 'results';

export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  folder: StorageFolder,
): Promise<string> {
  const formData = new FormData();
  formData.append('folder', folder);
  formData.append('filename', filename);
  formData.append('data', buffer.toString('base64'));

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { 'X-Secret': SECRET_TOKEN },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage upload failed (${res.status}): ${text}`);
  }

  const json = await res.json() as { url?: string };
  if (!json.url) throw new Error('Storage upload: missing url in response');
  return json.url;
}

// Downloads a URL and re-uploads it to storage. Used by the webhook handler.
export async function downloadAndStore(
  sourceUrl: string,
  filename: string,
  folder: StorageFolder,
): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to download ${sourceUrl}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadToStorage(buffer, filename, folder);
}

// Deletes a file from shared hosting by its public URL.
export async function deleteFromStorage(url: string): Promise<void> {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);
  const filename = decodeURIComponent(parts[parts.length - 1]);
  const folder = parts[parts.length - 2] as StorageFolder;

  const formData = new FormData();
  formData.append('action', 'delete');
  formData.append('folder', folder);
  formData.append('filename', filename);

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { 'X-Secret': SECRET_TOKEN },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage delete failed (${res.status}): ${text}`);
  }
}

// Builds a deterministic filename for a job output.
export function resultFilename(jobId: string, ext = 'png'): string {
  return `${jobId}.${ext}`;
}

export function uploadFilename(jobId: string, originalName: string): string {
  const ext = originalName.split('.').pop() ?? 'jpg';
  return `${jobId}.${ext}`;
}
