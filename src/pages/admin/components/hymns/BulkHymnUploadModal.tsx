import React, { useMemo, useState } from 'react';
import MediaDropzone from '@/components/ui/MediaDropzone';
import { XCircle, Music, CheckCircle, AlertTriangle } from 'lucide-react';
import { uploadApi, hinosApi } from '@/lib/api-client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (createdCount: number) => void;
}

interface PendingItem {
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'creating' | 'done' | 'error';
  message?: string;
  audioUrl?: string;
  duration?: string;
}

const BulkHymnUploadModal: React.FC<Props> = ({ isOpen, onClose, onCompleted }) => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [working, setWorking] = useState(false);

  // Upload via API PHP
  const uploadAudioFile = async (file: File): Promise<string | null> => {
    try {
      const res = await uploadApi.audio(file);
      if (res.error) {
        console.error('Erro no upload:', res.error);
        return null;
      }
      return res.data?.url || null;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const addFiles = (files: File[]) => {
    const mapped: PendingItem[] = files.map((f) => ({
      file: f,
      name: f.name,
      status: 'pending'
    }));
    setItems((prev) => [...prev, ...mapped]);
  };

  const extractDuration = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        const secs = Math.round(audio.duration || 0);
        URL.revokeObjectURL(objectUrl);
        const mm = Math.floor(secs / 60).toString().padStart(2, '0');
        const ss = Math.floor(secs % 60).toString().padStart(2, '0');
        resolve(`${mm}:${ss}`);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Falha ao ler duração'));
      };
    });
  };

  const startUpload = async () => {
    if (!items.length) return;
    setWorking(true);
    let created = 0;

    const processItem = async (i: number) => {
      const curr = items[i];
      try {
        console.log(`\n🎵 [${i + 1}/${items.length}] Processando: ${curr.name}`);
        
        // 1) Upload
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: 'uploading', message: 'Enviando áudio...' } : it));
        console.log('  📤 Fazendo upload...');
        const audioUrl = await uploadAudioFile(curr.file);
        
        if (!audioUrl) {
          throw new Error('Upload retornou URL vazia');
        }
        console.log('  ✅ Upload OK:', audioUrl);

        // 2) Duração
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: 'uploading', message: 'Lendo duração...' } : it));
        console.log('  ⏱️  Extraindo duração...');
        const duration = await extractDuration(curr.file).catch((e) => {
          console.warn('  ⚠️  Erro ao extrair duração:', e);
          return '00:00';
        });
        console.log('  ✅ Duração:', duration);

        // 3) Criar registro no banco via API
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: 'creating', message: 'Criando hino...' } : it));
        
        const titleFromFile = curr.file.name
          .replace(/\.[^.]+$/, '') // Remove extensão
          .replace(/[\-_]+/g, ' ') // Troca - e _ por espaço
          .replace(/\s+/g, ' ') // Remove espaços duplos
          .trim();
        
        if (!titleFromFile || titleFromFile.length < 2) {
          throw new Error('Nome de arquivo inválido (muito curto)');
        }
        
        const payload = {
          titulo: titleFromFile,
          numero: null,
          audio_url: audioUrl,
          duracao: duration,
          ativo: 0, // draft
          compositor: null,
          categoria: null,
          letra: null,
          tags: null,
          cover_url: null
        };
        
        console.log('  📝 Criando hino:', payload);
        const res = await hinosApi.create(payload);
        console.log('  📥 Resposta COMPLETA:', JSON.stringify(res, null, 2));
        console.log('  📥 res.data:', res.data);
        console.log('  📥 res.error:', res.error);

        if (res.error) {
          throw new Error(res.error);
        }
        
        if (!res.data) {
          console.error('  ❌ API retornou res.data vazio!');
          throw new Error('API não retornou dados do hino criado');
        }
        
        console.log('  ✅ Hino criado! ID:', res.data.id || 'N/A');
        console.log('  ✅ Dados completos do hino:', res.data);

        created += 1;
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: 'done', message: 'Concluído ✓', audioUrl, duration } : it));
      } catch (err: any) {
        console.error(`  ❌ ERRO ao processar ${curr.name}:`, err);
        const errorMsg = err?.message || err?.toString() || 'Erro desconhecido';
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: 'error', message: errorMsg } : it));
      }
    };

    try {
      const concurrency = 3;
      const indices = items.map((_, idx) => idx);
      const runners: Promise<void>[] = [];
      for (let k = 0; k < concurrency; k++) {
        const run = async () => {
          while (indices.length) {
            const next = indices.shift();
            if (next === undefined) break;
            await processItem(next);
          }
        };
        runners.push(run());
      }
      await Promise.all(runners);
    } finally {
      setWorking(false);
      onCompleted(created);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-background-primary rounded-xl max-w-4xl w-full p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Music className="w-6 h-6 text-primary-400" /> Upload em Lote de Hinos
            </h2>
            <p className="text-gray-400 text-sm">Solte vários arquivos de áudio (MP3, WAV, FLAC...) para criar hinos em rascunho automaticamente.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background-tertiary rounded-lg transition-colors">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <MediaDropzone
          accept="audio/*"
          multiple
          allowVideo={false}
          maxSize={50}
          onFilesSelect={addFiles}
          onFileSelect={(file) => addFiles([file])}
        />

        {/* Lista */}
        {items.length > 0 && (
          <div className="mt-6 space-y-2 max-h-72 overflow-auto pr-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-white">{it.name}</div>
                  <div className="text-xs text-gray-400">{it.duration ? `(${it.duration})` : ''}</div>
                </div>
                <div className="text-xs">
                  {it.status === 'pending' && <span className="text-gray-400">Aguardando</span>}
                  {it.status === 'uploading' && <span className="text-yellow-400">{it.message}</span>}
                  {it.status === 'creating' && <span className="text-blue-400">{it.message}</span>}
                  {it.status === 'done' && <span className="text-green-400 inline-flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Concluído</span>}
                  {it.status === 'error' && <span className="text-red-400 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {it.message}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
            Fechar
          </button>
          <button
            onClick={startUpload}
            disabled={working || items.length === 0}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              working || items.length === 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 text-black'
            }`}
          >
            {working ? 'Enviando...' : 'Iniciar Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkHymnUploadModal;
