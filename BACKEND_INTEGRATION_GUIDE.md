# 🔗 Guia de Integração Frontend ↔ Backend

Este guia mostra como integrar o frontend React com o backend Supabase.

---

## 📦 Fase 2 Backend - Implementação Completa

### ✅ O que foi implementado:

#### **1. Database Schema** (`supabase/schema.sql`)
- ✅ 13 tabelas principais
- ✅ Indexes otimizados
- ✅ Row Level Security (RLS)
- ✅ Triggers automáticos
- ✅ Functions SQL (increment_play_count, update_playlist_stats)
- ✅ Storage buckets (avatars, covers, audio)

#### **2. Seed Data** (`supabase/seed.sql`)
- ✅ 3 artistas
- ✅ 5 álbuns
- ✅ 10 músicas de exemplo
- ✅ Dados prontos para desenvolvimento

#### **3. Configuração Supabase** (`src/lib/supabase.ts`)
- ✅ Cliente Supabase configurado
- ✅ Helper functions
- ✅ Autenticação setup
- ✅ Upload de arquivos

#### **4. TypeScript Types** (`src/types/supabase.ts`)
- ✅ Tipos completos do database
- ✅ Type safety total
- ✅ Auto-complete no IDE

#### **5. Custom Hooks** (`src/hooks/useSupabase.ts`)
- ✅ useSupabaseQuery - queries genéricas
- ✅ useAuth - autenticação
- ✅ useUserProfile - perfil do usuário
- ✅ useLikedSongs - músicas curtidas
- ✅ useUserPlaylists - playlists
- ✅ useSongs - músicas com filtros
- ✅ usePlayHistory - histórico
- ✅ useRealtimeSubscription - tempo real

#### **6. Services Layer** (`src/services/`)
- ✅ SongsService - gerenciamento de músicas
- ✅ PlaylistsService - CRUD de playlists
- ✅ AuthService - autenticação completa

#### **7. Documentação**
- ✅ SUPABASE_SETUP.md - guia completo
- ✅ .env.example - variáveis de ambiente
- ✅ Este guia de integração

---

## 🚀 Como Integrar

### **Passo 1: Setup Supabase**

Siga o guia `SUPABASE_SETUP.md` para:
1. Criar projeto
2. Aplicar schema
3. Popular com seed
4. Configurar buckets
5. Obter credenciais

### **Passo 2: Configurar Variáveis**

```bash
# Copiar .env.example para .env
cp .env.example .env

# Editar e preencher credenciais
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### **Passo 3: Instalar Dependências**

```bash
npm install
```

Isso instalará `@supabase/supabase-js` e todas dependências.

### **Passo 4: Substituir Dados Mockados**

#### **Exemplo: HomePage**

**Antes (mockado):**
```typescript
// src/pages/HomePage.tsx
const popularSongs = [
  { id: 1, title: 'Hino 100', ... }, // mock data
];
```

**Depois (Supabase):**
```typescript
// src/pages/HomePage.tsx
import { useSongs } from '@/hooks/useSupabase';

function HomePage() {
  const { songs, loading, error } = useSongs({ limit: 10 });
  
  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {songs.map(song => (
        <SongCard key={song.id} song={song} />
      ))}
    </div>
  );
}
```

#### **Exemplo: Autenticação**

**Antes (mockado):**
```typescript
// src/pages/LoginPage.tsx
const handleLogin = () => {
  // mock login
  setUser({ id: 1, email: 'test@test.com' });
};
```

**Depois (Supabase):**
```typescript
// src/pages/LoginPage.tsx
import { AuthService } from '@/services/authService';

const handleLogin = async () => {
  try {
    const { user, session } = await AuthService.signIn(email, password);
    // Zustand ou Context atualiza automaticamente
  } catch (error) {
    setError(error.message);
  }
};
```

---

## 📚 Exemplos de Uso

### **1. Buscar Músicas**

```typescript
import { SongsService } from '@/services/songsService';

// Buscar todas as músicas
const songs = await SongsService.getSongs();

// Buscar por categoria
const louvores = await SongsService.getSongsByCategory('louvor');

// Buscar músicas populares
const popular = await SongsService.getPopularSongs(10);

// Pesquisar
const results = await SongsService.searchSongs('vencendo');
```

### **2. Gerenciar Playlists**

```typescript
import { PlaylistsService } from '@/services/playlistsService';

// Criar playlist
const newPlaylist = await PlaylistsService.createPlaylist({
  name: 'Meus Favoritos',
  description: 'Hinos que amo',
  privacy: 'public',
  user_id: userId
});

// Adicionar música
await PlaylistsService.addSongToPlaylist(
  playlistId, 
  songId, 
  userId
);

// Buscar playlist com músicas
const playlist = await PlaylistsService.getPlaylistById(playlistId);
```

### **3. Curtir Músicas**

```typescript
import { useLikedSongs } from '@/hooks/useSupabase';

function LikedSongsPage() {
  const { likedSongs, loading, likeSong, unlikeSong } = useLikedSongs();
  
  return (
    <div>
      {likedSongs.map(item => (
        <SongCard 
          key={item.id} 
          song={item.songs}
          onUnlike={() => unlikeSong(item.song_id)}
        />
      ))}
    </div>
  );
}
```

### **4. Autenticação**

```typescript
import { AuthService } from '@/services/authService';

// Registrar
await AuthService.signUp(email, password, name);

// Login
await AuthService.signIn(email, password);

// Login social
await AuthService.signInWithGoogle();

// Logout
await AuthService.signOut();

// Verificar premium
const isPremium = await AuthService.hasPremium();
```

### **5. Upload de Avatar**

```typescript
import { AuthService } from '@/services/authService';

const handleAvatarUpload = async (file: File) => {
  const url = await AuthService.uploadAvatar(file);
  console.log('Avatar URL:', url);
};
```

### **6. Tempo Real (Queue)**

```typescript
import { useRealtimeSubscription } from '@/hooks/useSupabase';

function QueueComponent() {
  useRealtimeSubscription('queue', (payload) => {
    console.log('Queue updated:', payload);
    // Atualizar UI
  });
}
```

---

## 🔄 Migração Passo a Passo

### **Ordem Recomendada:**

1. ✅ **Autenticação** (crítico primeiro)
   - Login/Registro
   - Perfil do usuário

2. ✅ **Músicas** (core do app)
   - Lista de músicas
   - Busca
   - Player

3. ✅ **Playlists**
   - CRUD completo
   - Adicionar/remover músicas

4. ✅ **Social Features**
   - Curtidas
   - Seguir artistas

5. ✅ **Premium**
   - Verificação de assinatura
   - Upgrade flow

6. ✅ **Otimizações**
   - Cache
   - Realtime
   - Performance

---

## 🎯 Checklist de Integração

### **AuthStore (Zustand)**
- [ ] Substituir mock login por `AuthService.signIn()`
- [ ] Adicionar listener de auth state
- [ ] Carregar perfil real do usuário
- [ ] Implementar logout real

### **PlayerStore (Zustand)**
- [ ] Carregar áudio do Supabase Storage
- [ ] Registrar histórico de reprodução
- [ ] Incrementar play count
- [ ] Sync com queue do database

### **HomePage**
- [ ] Carregar músicas do database
- [ ] Buscar populares via `SongsService`
- [ ] Recomendações baseadas em gostos

### **SearchPage**
- [ ] Implementar busca real
- [ ] Filtros por categoria
- [ ] Autocomplete

### **LibraryPage**
- [ ] Carregar playlists do usuário
- [ ] Músicas curtidas do database
- [ ] Criar playlist real

### **PlaylistDetailPage**
- [ ] Carregar playlist do database
- [ ] Adicionar/remover músicas
- [ ] Reordenar com drag & drop
- [ ] Atualizar metadados

### **SettingsPage**
- [ ] Salvar preferências no database
- [ ] Carregar ao montar componente
- [ ] Sync em tempo real (opcional)

---

## ⚡ Performance Tips

### **1. React Query (Recomendado)**

```typescript
import { useQuery } from '@tanstack/react-query';
import { SongsService } from '@/services/songsService';

function useSongs() {
  return useQuery({
    queryKey: ['songs'],
    queryFn: () => SongsService.getSongs(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

### **2. Prefetch**

```typescript
// Prefetch na Home para melhorar UX
useEffect(() => {
  queryClient.prefetchQuery(['popular-songs'], 
    () => SongsService.getPopularSongs()
  );
}, []);
```

### **3. Optimistic Updates**

```typescript
const likeSong = useMutation({
  mutationFn: (songId) => supabase
    .from('liked_songs')
    .insert({ song_id: songId }),
  onMutate: async (songId) => {
    // Update UI imediatamente
    queryClient.setQueryData(['liked-songs'], (old) => [
      ...old,
      { song_id: songId }
    ]);
  }
});
```

---

## 🐛 Troubleshooting

### **Erro: "Invalid API key"**
```bash
# Verificar .env
cat .env

# Recarregar variáveis
npm run dev
```

### **Erro: "Row Level Security"**
```sql
-- Verificar policies no Supabase
SELECT * FROM pg_policies WHERE tablename = 'songs';
```

### **Queries lentas**
```typescript
// Adicionar indexes
CREATE INDEX idx_songs_title ON songs USING gin(to_tsvector('portuguese', title));
```

---

## 📊 Monitoramento

### **Logs do Supabase:**
1. Vá em **Logs** no painel
2. Filtre por erros
3. Configure alertas

### **Performance:**
```typescript
// Medir tempo de queries
console.time('fetch-songs');
const songs = await SongsService.getSongs();
console.timeEnd('fetch-songs');
```

---

## 🚀 Próximos Passos

Após integração completa:

1. **Testes**
   - Unit tests dos services
   - Integration tests
   - E2E com Playwright

2. **PWA**
   - Service Worker
   - Offline mode
   - Cache strategies

3. **Deploy**
   - Vercel (frontend)
   - Supabase (backend já está)
   - Domínio custom

4. **Monitoring**
   - Error tracking (Sentry)
   - Analytics (GA4)
   - Performance (Vercel Analytics)

---

**A integração está pronta para começar! 🎉**

Todos os arquivos necessários foram criados. Basta seguir este guia passo a passo.
