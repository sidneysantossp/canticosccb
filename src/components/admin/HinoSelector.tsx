import React, { useEffect, useRef, useState } from 'react';
import { Search, Music, Plus, X, GripVertical, Play, Pause, Loader2 } from 'lucide-react';
import { hinosApi, Hino } from '@/lib/api-client';
import { resolveTrackAudioUrl } from '@/lib/playableAudio';

interface HinoSelectorProps {
  selectedHinos: Hino[];
  onSelectionChange: (hinos: Hino[]) => void;
  enableAudioPreview?: boolean;
}

const HinoSelector: React.FC<HinoSelectorProps> = ({
  selectedHinos,
  onSelectionChange,
  enableAudioPreview = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableHinos, setAvailableHinos] = useState<Hino[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [playingHinoId, setPlayingHinoId] = useState<string | null>(null);
  const [loadingHinoId, setLoadingHinoId] = useState<string | null>(null);
  const [audioErrorHinoId, setAudioErrorHinoId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Carregar hinos disponíveis
  useEffect(() => {
    if (searchQuery.length >= 2) {
      loadHinos();
    }
  }, [searchQuery]);

  const loadHinos = async () => {
    try {
      setIsLoading(true);
      const response = await hinosApi.list({ search: searchQuery, limit: 20 });
      
      if (response.data) {
        const responseData = response.data as any;
        const hinos = responseData.hinos || responseData.data || responseData;
        if (Array.isArray(hinos)) {
          // Filtrar hinos já selecionados
          const selectedIds = selectedHinos.map(h => String(h.id));
          const filtered = hinos.filter((h: Hino) => !selectedIds.includes(String(h.id)));
          setAvailableHinos(filtered);
          setShowDropdown(true);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar hinos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHino = (hino: Hino) => {
    onSelectionChange([...selectedHinos, hino]);
    // Não limpa a busca nem fecha o dropdown - permite seleção contínua
    // Remove o hino da lista disponível
    setAvailableHinos(prev => prev.filter(h => h.id !== hino.id));
  };

  const handleRemoveHino = (hinoId: string | number) => {
    if (playingHinoId === String(hinoId)) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingHinoId(null);
      setLoadingHinoId(null);
    }
    onSelectionChange(selectedHinos.filter(h => String(h.id) !== String(hinoId)));
  };

  const handleAudioPreview = async (hino: Hino) => {
    const hinoId = String(hino.id);

    if (playingHinoId === hinoId && audioRef.current) {
      audioRef.current.pause();
      setPlayingHinoId(null);
      return;
    }

    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingHinoId(null);
    setAudioErrorHinoId(null);
    setLoadingHinoId(hinoId);

    const audioUrl = resolveTrackAudioUrl({
      id: hino.id,
      title: hino.titulo,
      number: hino.numero,
      audioUrl: hino.audio_url,
      youtubeSource: hino.youtube_source,
    });

    if (!audioUrl) {
      setLoadingHinoId(null);
      setAudioErrorHinoId(hinoId);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;
    audio.onplaying = () => {
      setLoadingHinoId(null);
      setPlayingHinoId(hinoId);
    };
    audio.onpause = () => {
      if (!audio.ended) setPlayingHinoId(null);
    };
    audio.onended = () => {
      setPlayingHinoId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setLoadingHinoId(null);
      setPlayingHinoId(null);
      setAudioErrorHinoId(hinoId);
      audioRef.current = null;
    };

    try {
      await audio.play();
    } catch {
      setLoadingHinoId(null);
      setPlayingHinoId(null);
      setAudioErrorHinoId(hinoId);
      audioRef.current = null;
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...selectedHinos];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    onSelectionChange(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedHinos.length - 1) return;
    const newList = [...selectedHinos];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    onSelectionChange(newList);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-gray-400 text-sm font-semibold">
          Hinos do Álbum
        </label>
        <span className="text-gray-500 text-sm">
          {selectedHinos.length} {selectedHinos.length === 1 ? 'hino selecionado' : 'hinos selecionados'}
        </span>
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            placeholder="Buscar hinos para adicionar... (min. 2 caracteres)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-600"
          />
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && searchQuery.length >= 2 && (
          <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : availableHinos.length > 0 ? (
              <div className="p-2">
                {availableHinos.map((hino) => (
                  <button
                    type="button"
                    key={hino.id}
                    onClick={() => handleAddHino(hino)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
                  >
                    <Music className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {hino.numero ? `${hino.numero} - ` : ''}{hino.titulo}
                      </p>
                      {hino.compositor && (
                        <p className="text-gray-400 text-sm truncate">{hino.compositor}</p>
                      )}
                    </div>
                    <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum hino encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de hinos selecionados */}
      {selectedHinos.length > 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2">
          {selectedHinos.map((hino, index) => (
            <div
              key={hino.id}
              className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg group hover:bg-gray-750 transition-colors"
            >
              {/* Drag handle */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover para cima"
                >
                  <div className="w-4 h-1 bg-current rounded"></div>
                </button>
                <GripVertical className="w-4 h-4 text-gray-500" />
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === selectedHinos.length - 1}
                  className="text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover para baixo"
                >
                  <div className="w-4 h-1 bg-current rounded"></div>
                </button>
              </div>

              {/* Número da faixa */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 text-sm font-semibold">
                {index + 1}
              </div>

              {/* Info do hino */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {hino.numero ? `${hino.numero} - ` : ''}{hino.titulo}
                </p>
                {hino.compositor && (
                  <p className="text-gray-400 text-sm truncate">{hino.compositor}</p>
                )}
              </div>

              {/* Duração */}
              {hino.duracao && (
                <span className="text-gray-400 text-sm flex-shrink-0">
                  {hino.duracao}
                </span>
              )}

              {enableAudioPreview && (
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleAudioPreview(hino)}
                    disabled={loadingHinoId !== null}
                    className={`p-2.5 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      playingHinoId === String(hino.id)
                        ? 'bg-green-500 text-gray-950 border-green-400 hover:bg-green-400'
                        : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                    }`}
                    aria-label={playingHinoId === String(hino.id) ? `Pausar ${hino.titulo}` : `Ouvir ${hino.titulo}`}
                    title={playingHinoId === String(hino.id) ? 'Pausar prévia' : 'Ouvir prévia'}
                  >
                    {loadingHinoId === String(hino.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : playingHinoId === String(hino.id) ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>
                  {audioErrorHinoId === String(hino.id) && (
                    <span className="text-red-400 text-[11px] whitespace-nowrap">Áudio indisponível</span>
                  )}
                </div>
              )}

              {/* Botão remover */}
              <button
                type="button"
                onClick={() => handleRemoveHino(hino.id)}
                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                title="Remover do álbum"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-lg p-8 text-center">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">Nenhum hino adicionado</p>
          <p className="text-gray-500 text-sm">Use o campo de busca acima para adicionar hinos</p>
        </div>
      )}
    </div>
  );
};

export default HinoSelector;
