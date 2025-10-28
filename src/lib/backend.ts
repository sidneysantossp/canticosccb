// Stub backend to satisfy imports during migration (no real backend)
export const isSupabaseConfigured = false;

function createSubscription() { return { unsubscribe: () => {} }; }

function createBuilder(_table: string) {
  const builder: any = {
    select: () => builder,
    insert: () => ({ select: async () => ({ data: [], error: null }), single: async () => ({ data: null, error: null }) }),
    update: () => ({ select: async () => ({ data: [], error: null }), single: async () => ({ data: null, error: null }), eq: () => ({ select: async () => ({ data: [], error: null }) }) }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: async () => ({ data: null, error: null }),
  };
  return builder;
}

export const supabase: any = {
  auth: {
    async getUser() { return { data: { user: null }, error: null }; },
    async getSession() { return { data: { session: null }, error: null }; },
    async signInWithPassword({ email }: { email: string; password: string }) { const user = { id: 'stub', email }; return { data: { user, session: { user } }, error: null }; },
    async signUp({ email }: { email: string; password: string }) { const user = { id: 'stub', email }; return { data: { user, session: null }, error: null }; },
    async signOut() { return { error: null }; },
    onAuthStateChange() { return { data: { subscription: createSubscription() } }; },
  },
  from(table: string) { return createBuilder(table); },
  channel() { return { on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }), unsubscribe: () => {} }; },
  storage: { from: () => ({ upload: async () => ({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
};

export default supabase;
