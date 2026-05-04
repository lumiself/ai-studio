import Replicate from 'replicate';
import { createServiceSupabase } from './supabase';

let _client: Replicate | null = null;

async function getClient(): Promise<Replicate> {
  if (_client) return _client;
  // API key comes from DB settings so admin can rotate it without redeploying.
  const db = createServiceSupabase();
  const { data } = await db
    .from('settings')
    .select('value')
    .eq('key', 'replicate_api_key')
    .single();

  const apiKey = data?.value || process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error('Replicate API key not configured');

  _client = new Replicate({ auth: apiKey });
  return _client;
}

// Invalidate cached client when the API key changes (call after saving settings).
export function invalidateReplicateClient() {
  _client = null;
}

export interface CreatePredictionParams {
  model: string;          // 'owner/model:version' format
  input: Record<string, unknown>;
  webhookUrl: string;     // Vercel function URL that Replicate will POST to on completion
  jobId: string;          // stored in webhook_events_filter metadata (via URL param)
}

export async function createPrediction(params: CreatePredictionParams): Promise<string> {
  const client = await getClient();

  const [ownerModel, version] = params.model.split(':');
  if (!ownerModel || !version) throw new Error(`Invalid model format: ${params.model}`);

  const prediction = await client.predictions.create({
    version,
    input: params.input,
    webhook: `${params.webhookUrl}?jobId=${params.jobId}`,
    webhook_events_filter: ['completed'],
  });

  return prediction.id;
}

// Verifies the Replicate webhook signature.
// Returns true if the signature matches the secret.
export async function verifyWebhookSignature(
  body: string,
  headers: Headers,
): Promise<boolean> {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) return false;

  const webhookId = headers.get('webhook-id');
  const webhookTimestamp = headers.get('webhook-timestamp');
  const webhookSignature = headers.get('webhook-signature');
  if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const encoder = new TextEncoder();
  const keyData = Uint8Array.from(atob(secret.split('_')[1] ?? secret), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
  const computed = `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  return webhookSignature.split(' ').some(sig => sig === computed);
}

// Loads all model overrides from DB settings. Used by resolveModel().
export async function getModelOverrides(): Promise<Record<string, string>> {
  const db = createServiceSupabase();
  const { data } = await db
    .from('settings')
    .select('key, value')
    .like('key', 'model_%');

  if (!data) return {};
  return Object.fromEntries(data.filter(r => r.value).map(r => [r.key, r.value]));
}
