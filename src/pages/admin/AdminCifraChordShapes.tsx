import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Music, Plus, RefreshCw, Save, Star, Trash2 } from 'lucide-react';

import AlertModal from '@/components/ui/AlertModal';
import {
  CIFRA_CHORD_PRESET_GROUPS,
  createCifraChordShape,
  deleteCifraChordShape,
  fetchCifraChordShapes,
  prioritizeCifraChordShape,
  syncCifraChordShapePresets,
  updateCifraChordShape,
} from '@/lib/admin/cifrasV2AdminApi';
import type { CifraChordPresetGroup } from '@/lib/admin/cifrasV2AdminApi';
import { CIFRA_V2_INSTRUMENTS, type CifraChordShape, type CifraInstrument } from '@/types/cifras-v2';

type ShapeFormState = {
  id: string | null;
  instrument: CifraInstrument;
  chord_name: string;
  variation_name: string;
  frets: string;
  fingers: string;
  barres: string;
  notes: string;
  tuning: string;
  stringCount: string;
  base_fret: string;
  priority: string;
  is_left_handed_supported: boolean;
  is_active: boolean;
};

const DEFAULT_TUNING: Record<CifraInstrument, string> = {
  violao: 'E A D G B E',
  guitarra: 'E A D G B E',
  ukulele: 'G C E A',
  teclado: 'C D E F G A B',
  cavaco: 'D G B D',
  outro: '',
};

const EMPTY_FORM: ShapeFormState = {
  id: null,
  instrument: 'violao',
  chord_name: '',
  variation_name: 'default',
  frets: '',
  fingers: '',
  barres: '',
  notes: '',
  tuning: DEFAULT_TUNING.violao,
  stringCount: '6',
  base_fret: '1',
  priority: '0',
  is_left_handed_supported: false,
  is_active: true,
};

function parseNumberList(value: string): number[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseStringList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyList(values: unknown): string {
  if (!Array.isArray(values)) return '';
  return values.join(', ');
}

function mapShapeToForm(shape: CifraChordShape): ShapeFormState {
  return {
    id: shape.id,
    instrument: shape.instrument,
    chord_name: shape.chord_name,
    variation_name: shape.variation_name || 'default',
    frets: stringifyList(shape.fingering.frets ?? shape.fingering.positions ?? shape.fingering.strings),
    fingers: stringifyList(shape.fingering.fingers),
    barres: stringifyList(shape.fingering.barres),
    notes: stringifyList(shape.fingering.notes),
    tuning: typeof shape.fingering.tuning === 'string' ? shape.fingering.tuning : DEFAULT_TUNING[shape.instrument],
    stringCount: String(shape.fingering.stringCount ?? ''),
    base_fret: String(shape.base_fret || 1),
    priority: String(shape.priority ?? 0),
    is_left_handed_supported: shape.is_left_handed_supported,
    is_active: shape.is_active,
  };
}

const AdminCifraChordShapes: React.FC = () => {
  const [shapes, setShapes] = useState<CifraChordShape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingPresets, setIsSyncingPresets] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<CifraInstrument | ''>('');
  const [presetGroup, setPresetGroup] = useState<CifraChordPresetGroup>('all');
  const [form, setForm] = useState<ShapeFormState>(EMPTY_FORM);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    void loadShapes();
  }, []);

  async function loadShapes() {
    try {
      setIsLoading(true);
      const rows = await fetchCifraChordShapes({ onlyActive: false, limit: 500 });
      setShapes(rows);
    } catch (error: any) {
      console.error('Erro ao carregar shapes:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao carregar',
        message: error?.message || 'Nao foi possivel carregar os shapes cadastrados.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredShapes = useMemo(() => (
    shapes.filter((shape) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesInstrument = !instrumentFilter || shape.instrument === instrumentFilter;
      const matchesSearch = !normalizedSearch
        || shape.chord_name.toLowerCase().includes(normalizedSearch)
        || shape.variation_name.toLowerCase().includes(normalizedSearch);
      return matchesInstrument && matchesSearch;
    })
  ), [instrumentFilter, searchTerm, shapes]);

  const preferredShapeIds = useMemo(() => {
    const entries = new Map<string, string>();

    shapes.forEach((shape) => {
      const key = `${shape.instrument}::${shape.chord_name.toLowerCase()}`;
      const currentId = entries.get(key);
      if (!currentId) {
        entries.set(key, shape.id);
      }
    });

    return entries;
  }, [shapes]);

  function resetForm(nextInstrument?: CifraInstrument) {
    const instrument = nextInstrument ?? form.instrument ?? 'violao';
    setForm({
      ...EMPTY_FORM,
      instrument,
      tuning: DEFAULT_TUNING[instrument],
      stringCount: instrument === 'ukulele' ? '4' : instrument === 'cavaco' ? '4' : instrument === 'teclado' ? '7' : '6',
    });
  }

  function handleInstrumentChange(value: CifraInstrument) {
    setForm((current) => ({
      ...current,
      instrument: value,
      tuning: current.id ? current.tuning : DEFAULT_TUNING[value],
      stringCount: current.id ? current.stringCount : (value === 'ukulele' ? '4' : value === 'cavaco' ? '4' : value === 'teclado' ? '7' : '6'),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.chord_name.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Nome obrigatorio',
        message: 'Informe o nome do acorde antes de salvar.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        instrument: form.instrument,
        chord_name: form.chord_name.trim(),
        variation_name: form.variation_name.trim() || 'default',
        base_fret: Number(form.base_fret || 1),
        priority: Number(form.priority || 0),
        is_left_handed_supported: form.is_left_handed_supported,
        is_active: form.is_active,
        fingering: {
          frets: parseNumberList(form.frets),
          fingers: parseNumberList(form.fingers),
          barres: parseNumberList(form.barres),
          notes: parseStringList(form.notes),
          tuning: form.tuning.trim(),
          stringCount: Number(form.stringCount || 0) || undefined,
        },
      };

      if (form.id) {
        await updateCifraChordShape(form.id, payload);
      } else {
        await createCifraChordShape(payload);
      }

      await loadShapes();
      resetForm(form.instrument);
      setAlertModal({
        isOpen: true,
        title: form.id ? 'Shape atualizado' : 'Shape criado',
        message: form.id
          ? 'O shape foi atualizado com sucesso.'
          : 'O novo shape foi salvo no dicionario de acordes.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erro ao salvar shape:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao salvar',
        message: error?.message || 'Nao foi possivel salvar o shape do acorde.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(shape: CifraChordShape) {
    if (!window.confirm(`Excluir o shape "${shape.chord_name}" (${shape.instrument})?`)) {
      return;
    }

    try {
      await deleteCifraChordShape(shape.id);
      await loadShapes();
      if (form.id === shape.id) {
        resetForm(shape.instrument);
      }
      setAlertModal({
        isOpen: true,
        title: 'Shape removido',
        message: 'O shape foi removido do dicionario.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erro ao excluir shape:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao excluir',
        message: error?.message || 'Nao foi possivel excluir o shape selecionado.',
        type: 'error',
      });
    }
  }

  async function handleSyncPresets() {
    try {
      setIsSyncingPresets(true);
      const result = await syncCifraChordShapePresets(presetGroup);
      await loadShapes();
      setAlertModal({
        isOpen: true,
        title: 'Presets aplicados',
        message: `${result.processed} shapes processados. ${result.created} criados e ${result.updated} atualizados.`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erro ao aplicar presets:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao aplicar presets',
        message: error?.message || 'Nao foi possivel sincronizar os presets de shapes.',
        type: 'error',
      });
    } finally {
      setIsSyncingPresets(false);
    }
  }

  async function handlePrioritize(shape: CifraChordShape) {
    try {
      const result = await prioritizeCifraChordShape(shape.id);
      await loadShapes();
      setAlertModal({
        isOpen: true,
        title: 'Variacao destacada',
        message: `${result.target.chord_name} (${result.target.instrument}) agora usa essa variacao como principal.`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erro ao priorizar shape:', error);
      setAlertModal({
        isOpen: true,
        title: 'Erro ao destacar',
        message: error?.message || 'Nao foi possivel definir essa variacao como principal.',
        type: 'error',
      });
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Music className="w-8 h-8 text-primary-400" />
            Dicionario de Shapes
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie diagramas de acordes por instrumento para o modulo cifras v2.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => resetForm(instrumentFilter || 'violao')}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo shape
          </button>
          <button
            type="button"
            onClick={() => void loadShapes()}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-5 mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Importar presets base</h2>
            <p className="text-sm text-gray-300 mt-1">
              Sincroniza o dicionario inicial de acordes para violao, guitarra, ukulele, cavaco e teclado sem depender do seed SQL.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={presetGroup}
              onChange={(event) => setPresetGroup(event.target.value as CifraChordPresetGroup)}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CIFRA_CHORD_PRESET_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>{group.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleSyncPresets()}
              disabled={isSyncingPresets}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 font-semibold text-black transition-colors hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isSyncingPresets ? 'Sincronizando...' : 'Aplicar presets'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr,220px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por acorde ou variacao..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={instrumentFilter}
              onChange={(event) => setInstrumentFilter(event.target.value as CifraInstrument | '')}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos os instrumentos</option>
              {CIFRA_V2_INSTRUMENTS.map((instrument) => (
                <option key={instrument.value} value={instrument.value}>{instrument.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{shapes.length}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-gray-400 text-sm">Ativos</p>
              <p className="text-2xl font-bold text-green-400">{shapes.filter((shape) => shape.is_active).length}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-gray-400 text-sm">Instrumentos</p>
              <p className="text-2xl font-bold text-white">{new Set(shapes.map((shape) => shape.instrument)).size}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <p className="text-gray-400 text-sm">Filtrados</p>
              <p className="text-2xl font-bold text-white">{filteredShapes.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
            <div className="grid grid-cols-[1.2fr,1fr,140px,120px,160px] gap-3 px-5 py-3 text-xs uppercase tracking-[0.18em] text-gray-500 border-b border-gray-800">
              <span>Acorde</span>
              <span>Variacao</span>
              <span>Instrumento</span>
              <span>Prioridade</span>
              <span>Acoes</span>
            </div>
            <div className="divide-y divide-gray-800">
              {isLoading ? (
                <div className="px-5 py-10 text-center text-gray-400">Carregando shapes...</div>
              ) : filteredShapes.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400">Nenhum shape encontrado.</div>
              ) : filteredShapes.map((shape) => (
                <div key={shape.id} className="grid grid-cols-[1.2fr,1fr,140px,120px,160px] gap-3 px-5 py-4 items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{shape.chord_name}</p>
                      {preferredShapeIds.get(`${shape.instrument}::${shape.chord_name.toLowerCase()}`) === shape.id ? (
                        <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-200">
                          Principal
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Base fret {shape.base_fret} · {shape.is_active ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-300">{shape.variation_name}</p>
                  <p className="text-sm text-gray-300">{shape.instrument}</p>
                  <p className="text-sm text-gray-300">{shape.priority}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => void handlePrioritize(shape)}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-200 hover:bg-amber-500/20 transition-colors"
                      aria-label={`Destacar ${shape.chord_name}`}
                      title="Definir como variacao principal"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(mapShapeToForm(shape))}
                      className="rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-2 text-sm font-medium text-primary-200 hover:bg-primary-500/20 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(shape)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 transition-colors"
                      aria-label={`Excluir ${shape.chord_name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{form.id ? 'Editar shape' : 'Novo shape'}</h2>
              <p className="text-sm text-gray-400 mt-1">
                Cadastre frets, dedos, barres, notas e afinacao por instrumento.
              </p>
            </div>
            {form.id ? (
              <button
                type="button"
                onClick={() => resetForm(form.instrument)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Instrumento</span>
                <select
                  value={form.instrument}
                  onChange={(event) => handleInstrumentChange(event.target.value as CifraInstrument)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CIFRA_V2_INSTRUMENTS.map((instrument) => (
                    <option key={instrument.value} value={instrument.value}>{instrument.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Acorde</span>
                <input
                  type="text"
                  value={form.chord_name}
                  onChange={(event) => setForm((current) => ({ ...current, chord_name: event.target.value }))}
                  placeholder="Ex.: Am, G/B, F#7"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Variacao</span>
                <input
                  type="text"
                  value={form.variation_name}
                  onChange={(event) => setForm((current) => ({ ...current, variation_name: event.target.value }))}
                  placeholder="default"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Base fret</span>
                <input
                  type="number"
                  min="1"
                  value={form.base_fret}
                  onChange={(event) => setForm((current) => ({ ...current, base_fret: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Prioridade</span>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Frets / posicoes</span>
                <input
                  type="text"
                  value={form.frets}
                  onChange={(event) => setForm((current) => ({ ...current, frets: event.target.value }))}
                  placeholder="0, 2, 2, 1, 0, 0"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Dedos</span>
                <input
                  type="text"
                  value={form.fingers}
                  onChange={(event) => setForm((current) => ({ ...current, fingers: event.target.value }))}
                  placeholder="0, 2, 3, 1, 0, 0"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Barres</span>
                <input
                  type="text"
                  value={form.barres}
                  onChange={(event) => setForm((current) => ({ ...current, barres: event.target.value }))}
                  placeholder="1, 1"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Notas</span>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="A, C, E"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Afinacao</span>
                <input
                  type="text"
                  value={form.tuning}
                  onChange={(event) => setForm((current) => ({ ...current, tuning: event.target.value }))}
                  placeholder="E A D G B E"
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-gray-300">Qtde. de cordas / notas</span>
                <input
                  type="number"
                  min="0"
                  value={form.stringCount}
                  onChange={(event) => setForm((current) => ({ ...current, stringCount: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 text-amber-300" />
                <div className="space-y-1">
                  <p>Use listas separadas por virgula. Exemplo de Am no violao: frets `0, 0, 2, 2, 1, 0`.</p>
                  <p>Para teclado e instrumentos sem diagrama de trastes, voce pode cadastrar apenas notas, afinacao e stringCount.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_left_handed_supported}
                  onChange={(event) => setForm((current) => ({ ...current, is_left_handed_supported: event.target.checked }))}
                  className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                />
                Suporta canhoto
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
                />
                Shape ativo
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 font-semibold text-black transition-colors hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : form.id ? 'Salvar alteracoes' : 'Criar shape'}
              </button>
              <button
                type="button"
                onClick={() => resetForm(form.instrument)}
                className="rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Limpar formulario
              </button>
            </div>
          </form>
        </section>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((current) => ({ ...current, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default AdminCifraChordShapes;
