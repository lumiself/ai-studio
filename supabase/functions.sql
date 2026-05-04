-- Helper RPC functions used by lib/tokens.ts
-- Run this in the Supabase SQL Editor after schema.sql

-- Atomically deducts tokens; returns true on success, false if balance too low.
create or replace function deduct_tokens(p_user_id uuid, p_amount integer)
returns boolean
language plpgsql
security definer
as $$
declare
  v_balance integer;
begin
  select balance into v_balance
  from user_tokens
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    return false;
  end if;

  update user_tokens
  set balance = balance - p_amount,
      used    = used    + p_amount
  where user_id = p_user_id;

  return true;
end;
$$;

-- Adjusts balance by a positive or negative delta.
create or replace function adjust_balance(p_user_id uuid, p_delta integer)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_tokens (user_id, balance, used)
  values (p_user_id, greatest(0, p_delta), 0)
  on conflict (user_id) do update
    set balance = greatest(0, user_tokens.balance + p_delta);
end;
$$;
