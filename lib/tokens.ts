import { createServiceSupabase } from './supabase';

export interface TokenBalance {
  plan: string;
  balance: number;
  used: number;
  is_admin: boolean;
}

export async function getBalance(userId: string): Promise<TokenBalance | null> {
  const db = createServiceSupabase();
  const { data, error } = await db
    .from('user_tokens')
    .select('plan, balance, used, is_admin')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as TokenBalance;
}

// Deducts `amount` tokens atomically. Returns false if insufficient balance.
export async function deductTokens(userId: string, amount: number): Promise<boolean> {
  const db = createServiceSupabase();

  // Use a raw RPC or conditional update to prevent race conditions.
  const { data, error } = await db.rpc('deduct_tokens', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) throw new Error(`Token deduction failed: ${error.message}`);
  return data === true;
}

// Assigns tokens to a user (admin action). Creates the row if missing.
export async function assignTokens(
  userId: string,
  amount: number,
  plan?: string,
): Promise<void> {
  const db = createServiceSupabase();
  const { error } = await db
    .from('user_tokens')
    .upsert({
      user_id: userId,
      balance: amount,
      ...(plan ? { plan } : {}),
    }, { onConflict: 'user_id', ignoreDuplicates: false });

  if (error) throw new Error(`assignTokens failed: ${error.message}`);
}

// Adjusts balance by a delta (positive = add, negative = subtract).
export async function adjustBalance(userId: string, delta: number): Promise<void> {
  const db = createServiceSupabase();
  const { error } = await db.rpc('adjust_balance', {
    p_user_id: userId,
    p_delta: delta,
  });
  if (error) throw new Error(`adjustBalance failed: ${error.message}`);
}
