import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { albunsApi } from '@/lib/api-client';

const ComposerAlbumsSimple: React.FC = () => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        console.log('🔄 Carregando álbuns...');
        setLoading(true);
        
        const response = await albunsApi.list({ page: 1, limit: 1000 } as any);
        console.log('📦 Resposta da API:', response);
        
        // Extrair álbuns da resposta
        const raw: any = response as any;
        let albumsData = [];
        
        if (Array.isArray(raw?.albuns)) {
          albumsData = raw.albuns;
          console.log('✅ Extraído de raw.albuns:', albumsData.length);
        } else if (Array.isArray(raw?.data)) {
          albumsData = raw.data;
          console.log('✅ Extraído de raw.data:', albumsData.length);
        }
        
        console.log('📋 Álbuns encontrados:', albumsData);
        setAlbums(albumsData);
        
      } catch (error) {
        console.error('❌ Erro ao carregar álbuns:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAlbums();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-6">Carregando álbuns...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Meus Álbuns (Teste Simples)</h1>
      
      <div className="mb-4">
        <p>Total de álbuns: <strong>{albums.length}</strong></p>
        <p>Usuário logado: <strong>{user?.nome || 'N/A'}</strong> (ID: {user?.id})</p>
      </div>
      
      {albums.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum álbum encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div key={album.id} className="bg-gray-800 rounded-lg p-4">
              <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                {album.cover_url ? (
                  <img 
                    src={album.cover_url} 
                    alt={album.titulo}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-500">Sem capa</span>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{album.titulo}</h3>
              <p className="text-gray-400 text-sm mb-2">{album.descricao || 'Sem descrição'}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>ID: {album.id}</span>
                <span>Ano: {album.ano || 'N/A'}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <span>Compositor ID: {album.compositor_id || 'null'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComposerAlbumsSimple;
