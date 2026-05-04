# Shared Hosting Setup

## Steps

1. Upload `upload.php` to your shared hosting at:
   ```
   /public_html/ai-uploads/upload.php
   ```

2. Create these two folders in the same directory:
   ```
   /public_html/ai-uploads/uploads/
   /public_html/ai-uploads/results/
   ```
   Set permissions to **755** on both folders.

3. Set the secret environment variable in your hosting control panel:
   ```
   AI_STUDIO_SECRET=your-long-random-secret-here
   ```
   Or open `upload.php` and hardcode it in the `$secret` line (less preferred).

4. In your Vercel project, add these environment variables:
   ```
   STORAGE_UPLOAD_URL=https://yoursite.com/ai-uploads/upload.php
   STORAGE_SECRET_TOKEN=your-long-random-secret-here
   STORAGE_BASE_URL=https://yoursite.com/ai-uploads/
   ```

## How it works

- `uploads/` stores original images (input to AI models)
- `results/` stores processed output images (permanent, served publicly)
- The Vercel serverless functions POST to `upload.php` to save files
- The `X-Secret` header must match `AI_STUDIO_SECRET` or the script returns 403
- Filenames are sanitized to prevent path traversal attacks
