import Link from 'next/link';
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createServiceSupabase();
  const { data } = await db.from('user_tokens').select('is_admin').eq('user_id', user.id).single();
  if (!data?.is_admin) redirect('/editor');

  return (
    <div className="admin-wrap">
      <nav className="admin-nav">
        <Link href="/admin/tokens" className="admin-nav__link">Token Management</Link>
        <Link href="/admin/presets" className="admin-nav__link">Preset Builder</Link>
        <Link href="/admin/settings" className="admin-nav__link">Settings</Link>
        <Link href="/editor" className="admin-nav__link admin-nav__link--back">← Editor</Link>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
