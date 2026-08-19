const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = required.filter((name) => !String(process.env[name] ?? '').trim());

if (missing.length > 0) {
  console.error(`[build] Missing required Supabase environment variable(s): ${missing.join(', ')}`);
  process.exit(1);
}

const url = String(process.env.VITE_SUPABASE_URL).trim();
try {
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.endsWith('.supabase.co')) {
    console.error('[build] VITE_SUPABASE_URL is not a valid Supabase project URL.');
    process.exit(1);
  }
} catch {
  console.error('[build] VITE_SUPABASE_URL is not a valid URL.');
  process.exit(1);
}

console.log('[build] Supabase environment validated for build.');
