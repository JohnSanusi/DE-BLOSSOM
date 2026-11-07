/**
 * Helper to detect if Supabase environment variables are real or placeholders
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes('your-project-id') || url.includes('placeholder')) return false;
  if (anonKey.includes('your-anon-key') || anonKey.includes('placeholder')) return false;

  return true;
}
