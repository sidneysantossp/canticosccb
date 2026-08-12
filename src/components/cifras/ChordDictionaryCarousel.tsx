import React, { useMemo } from 'react';
import { getChordDiagram, type ChordDiagram } from '@/utils/chordUtils';
import {
  explainCifraChordNameMatch,
  resolveCifraVersionChordOverride,
} from '@/lib/cifras-v2';
import type { CifraChordShape, CifraVersionChordOverride } from '@/types/cifras-v2';

type VisibleChordCard =
  | { chord: string; kind: 'database'; shapes: CifraChordShape[]; selectedShape: CifraChordShape; editorialOverride: CifraVersionChordOverride | null }
  | { chord: string; kind: 'fallback'; diagram: ChordDiagram };

interface ChordDictionaryCarouselProps {
  chords: string[];
  chordShapeVariants: Record<string, CifraChordShape[]>;
  selectedShapeIds: Record<string, string>;
  selectedInstrument: string;
  selectedKey: string;
  originalKey: string;
  instrumentLabel: string;
  leftHanded?: boolean;
  chordOverrides?: CifraVersionChordOverride[] | null;
  onSelectShape: (chord: string, shapeId: string) => void;
  limit?: number;
  className?: string;
}

interface ChordDiagramSVGProps {
  diagram: ChordDiagram;
  leftHanded?: boolean;
}

function mirrorStringValues<T>(values: T[], stringCount: number, enabled?: boolean): T[] {
  const visible = values.slice(0, stringCount);
  return enabled ? [...visible].reverse() : visible;
}

const ChordDiagramSVG: React.FC<ChordDiagramSVGProps> = ({ diagram, leftHanded = false }) => {
  const { name, baseFret, barres } = diagram;
  const numStrings = 6;
  const numFrets = 5;
  const stringSpacing = 16;
  const fretSpacing = 18;
  const startX = 14;
  const startY = 30;
  const width = startX * 2 + stringSpacing * (numStrings - 1);
  const height = startY + fretSpacing * numFrets + 30;
  const frets = mirrorStringValues(diagram.frets, numStrings, leftHanded);

  return (
    <div className="inline-flex flex-col items-center">
      <span className="text-primary-400 font-bold text-sm mb-1">{name}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-gray-300">
        {/* Nut or fret number */}
        {baseFret === 1 ? (
          <rect x={startX - 1} y={startY - 2} width={stringSpacing * (numStrings - 1) + 2} height={3} fill="currentColor" rx={1} />
        ) : (
          <text x={startX - 10} y={startY + fretSpacing / 2 + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {baseFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: numFrets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * fretSpacing}
            x2={startX + stringSpacing * (numStrings - 1)}
            y2={startY + i * fretSpacing}
            stroke="#4B5563"
            strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + numFrets * fretSpacing}
            stroke="#6B7280"
            strokeWidth={1}
          />
        ))}

        {/* Barres */}
        {barres.map((barre, idx) => {
          const barreStrings = frets.reduce<number[]>((acc, f, i) => {
            if (f === barre) acc.push(i);
            return acc;
          }, []);
          if (barreStrings.length < 2) return null;
          const first = Math.min(...barreStrings);
          const last = Math.max(...barreStrings);
          const y = startY + (barre - baseFret + 0.5) * fretSpacing;
          return (
            <rect
              key={`barre-${idx}`}
              x={startX + first * stringSpacing - 4}
              y={y - 5}
              width={(last - first) * stringSpacing + 8}
              height={10}
              rx={5}
              fill="#10B981"
              opacity={0.8}
            />
          );
        })}

        {/* Finger dots */}
        {frets.map((fret, stringIdx) => {
          if (fret <= 0) return null;
          // Skip if it's the barre fret (already drawn)
          if (barres.includes(fret)) return null;
          const x = startX + stringIdx * stringSpacing;
          const y = startY + (fret - baseFret + 0.5) * fretSpacing;
          return (
            <circle
              key={`dot-${stringIdx}`}
              cx={x}
              cy={y}
              r={6}
              fill="#10B981"
            />
          );
        })}

        {/* Open/Muted string indicators */}
        {frets.map((fret, stringIdx) => {
          const x = startX + stringIdx * stringSpacing;
          if (fret === 0) {
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={startY - 10}
                r={4}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={1.5}
              />
            );
          }
          if (fret === -1) {
            return (
              <text
                key={`muted-${stringIdx}`}
                x={x}
                y={startY - 6}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                ×
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

interface FretboardShapeDiagram {
  name: string;
  frets: number[];
  barres: number[];
  baseFret: number;
  fingers: number[];
  stringCount: number;
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return item;
      }

      if (typeof item === 'string' && item.trim() !== '' && !Number.isNaN(Number(item))) {
        return Number(item);
      }

      return null;
    })
    .filter((item): item is number => item !== null);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function getInstrumentStringCount(instrument: string): number {
  switch (instrument) {
    case 'ukulele':
    case 'cavaco':
      return 4;
    case 'teclado':
      return 0;
    default:
      return 6;
  }
}

function normalizeDatabaseShape(shape: CifraChordShape): FretboardShapeDiagram | null {
  const frets = asNumberArray(shape.fingering.frets ?? shape.fingering.positions ?? shape.fingering.strings);
  if (frets.length === 0) {
    return null;
  }

  const stringCount = Math.max(
    1,
    Number(shape.fingering.stringCount) || frets.length || getInstrumentStringCount(shape.instrument),
  );

  return {
    name: shape.chord_name,
    frets: frets.slice(0, stringCount),
    barres: asNumberArray(shape.fingering.barres),
    baseFret: Number(shape.fingering.baseFret) || shape.base_fret || 1,
    fingers: asNumberArray(shape.fingering.fingers).slice(0, stringCount),
    stringCount,
  };
}

function buildShapeNotes(shape: CifraChordShape): string[] {
  const notes = asStringArray(shape.fingering.notes);
  const tuning = typeof shape.fingering.tuning === 'string' ? shape.fingering.tuning.trim() : '';
  const summary: string[] = [];

  if (shape.variation_name && shape.variation_name !== 'default') {
    summary.push(`Variacao: ${shape.variation_name}`);
  }

  if (tuning) {
    summary.push(`Afinacao: ${tuning}`);
  }

  if (notes.length > 0) {
    summary.push(`Notas: ${notes.join(' · ')}`);
  }

  return summary;
}

interface FretboardShapeSVGProps {
  diagram: FretboardShapeDiagram;
  leftHanded?: boolean;
}

const FretboardShapeSVG: React.FC<FretboardShapeSVGProps> = ({ diagram, leftHanded = false }) => {
  const { name, baseFret, barres, stringCount } = diagram;
  const numStrings = Math.max(1, stringCount);
  const numFrets = 5;
  const stringSpacing = numStrings <= 4 ? 18 : 16;
  const fretSpacing = 18;
  const startX = 14;
  const startY = 30;
  const width = startX * 2 + stringSpacing * (numStrings - 1);
  const height = startY + fretSpacing * numFrets + 30;
  const frets = mirrorStringValues(diagram.frets, numStrings, leftHanded);

  return (
    <div className="inline-flex flex-col items-center">
      <span className="text-primary-400 font-bold text-sm mb-1">{name}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-gray-300">
        {baseFret === 1 ? (
          <rect x={startX - 1} y={startY - 2} width={stringSpacing * (numStrings - 1) + 2} height={3} fill="currentColor" rx={1} />
        ) : (
          <text x={startX - 10} y={startY + fretSpacing / 2 + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {baseFret}fr
          </text>
        )}

        {Array.from({ length: numFrets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * fretSpacing}
            x2={startX + stringSpacing * (numStrings - 1)}
            y2={startY + i * fretSpacing}
            stroke="#4B5563"
            strokeWidth={1}
          />
        ))}

        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + numFrets * fretSpacing}
            stroke="#6B7280"
            strokeWidth={1}
          />
        ))}

        {barres.map((barre, idx) => {
          const barreStrings = frets.reduce<number[]>((acc, fret, stringIdx) => {
            if (fret === barre) {
              acc.push(stringIdx);
            }
            return acc;
          }, []);

          if (barreStrings.length < 2) {
            return null;
          }

          const first = Math.min(...barreStrings);
          const last = Math.max(...barreStrings);
          const y = startY + (barre - baseFret + 0.5) * fretSpacing;

          return (
            <rect
              key={`barre-${idx}`}
              x={startX + first * stringSpacing - 4}
              y={y - 5}
              width={(last - first) * stringSpacing + 8}
              height={10}
              rx={5}
              fill="#10B981"
              opacity={0.8}
            />
          );
        })}

        {frets.map((fret, stringIdx) => {
          if (fret <= 0 || barres.includes(fret)) {
            return null;
          }

          const x = startX + stringIdx * stringSpacing;
          const y = startY + (fret - baseFret + 0.5) * fretSpacing;

          return (
            <circle
              key={`dot-${stringIdx}`}
              cx={x}
              cy={y}
              r={6}
              fill="#10B981"
            />
          );
        })}

        {frets.map((fret, stringIdx) => {
          const x = startX + stringIdx * stringSpacing;
          if (fret === 0) {
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={startY - 10}
                r={4}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={1.5}
              />
            );
          }

          if (fret === -1) {
            return (
              <text
                key={`muted-${stringIdx}`}
                x={x}
                y={startY - 6}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                ×
              </text>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};

interface DatabaseChordShapeCardProps {
  chord: string;
  shapes: CifraChordShape[];
  selectedShapeId: string;
  onSelectShape: (chord: string, shapeId: string) => void;
  leftHanded?: boolean;
  editorialOverride?: CifraVersionChordOverride | null;
  matchOptions: {
    preferredKey?: string | null;
    originalKey?: string | null;
    progression?: string[] | null;
  };
}

function getShapeVariationLabel(requestedChord: string, shape: CifraChordShape): string {
  const variation = (shape.variation_name || '').trim();
  if (variation && variation.toLowerCase() !== 'default') {
    return variation;
  }

  if (shape.chord_name !== requestedChord) {
    return shape.chord_name;
  }

  return 'Padrao';
}

function getEditorialOverrideLabel(override?: CifraVersionChordOverride | null): string | null {
  if (!override) {
    return null;
  }

  return override.applies_to_key?.trim()
    ? `Editorial · ${override.applies_to_key.trim()}`
    : 'Editorial';
}

const DatabaseChordShapeCard: React.FC<DatabaseChordShapeCardProps> = ({
  chord,
  shapes,
  selectedShapeId,
  onSelectShape,
  leftHanded = false,
  editorialOverride,
  matchOptions,
}) => {
  const shape = shapes.find((item) => item.id === selectedShapeId) || shapes[0];
  const diagram = normalizeDatabaseShape(shape);
  const notes = buildShapeNotes(shape);
  const explanation = explainCifraChordNameMatch(chord, shape.chord_name, matchOptions);
  const isPrimaryShape = shapes[0]?.id === shape.id;
  const isEditorialShape = editorialOverride?.preferred_shape_id === shape.id;
  const editorialLabel = getEditorialOverrideLabel(editorialOverride);

  return (
    <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-background-secondary px-4 py-3 text-center min-w-[168px] max-w-[198px]">
      {diagram ? (
        <FretboardShapeSVG diagram={diagram} leftHanded={leftHanded && shape.instrument !== 'teclado'} />
      ) : (
        <div className="flex min-h-[132px] flex-col items-center justify-center">
          <span className="text-primary-400 font-bold text-sm">{shape.chord_name}</span>
          <span className="mt-3 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs text-primary-200">
            Shape salvo no banco
          </span>
        </div>
      )}
      <div className="mt-2 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{shape.instrument}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-200">
            {explanation.label}
          </span>
          {leftHanded && shape.instrument !== 'teclado' ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              Canhoto
            </span>
          ) : null}
          {isEditorialShape && editorialLabel ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
              {editorialLabel}
            </span>
          ) : null}
          {shapes.length > 1 && isPrimaryShape ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              Principal
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          {explanation.detail}
        </p>
        {notes.slice(0, 2).map((note) => (
          <p key={note} className="text-[11px] text-gray-400 leading-relaxed">
            {note}
          </p>
        ))}
      </div>
      {shapes.length > 1 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {shapes.map((option) => {
            const isActive = option.id === shape.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectShape(chord, option.id)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-500 text-black'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-primary-500/40 hover:text-white'
                }`}
              >
                {getShapeVariationLabel(chord, option)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};


const ChordDictionaryCarousel: React.FC<ChordDictionaryCarouselProps> = ({
  chords,
  chordShapeVariants,
  selectedShapeIds,
  selectedInstrument,
  selectedKey,
  originalKey,
  instrumentLabel,
  leftHanded = false,
  chordOverrides = null,
  onSelectShape,
  limit = 12,
  className = '',
}) => {
  const visibleChordCards = useMemo<VisibleChordCard[]>(() => chords
    .slice(0, limit)
    .map((chord) => {
      const databaseShapes = chordShapeVariants[chord];
      const editorialOverride = chordOverrides
        ? resolveCifraVersionChordOverride(chordOverrides, chord, selectedKey)
        : null;

      if (databaseShapes?.length) {
        const selectedShape = databaseShapes.find((shape) => shape.id === selectedShapeIds[chord]) || databaseShapes[0];
        return {
          chord,
          kind: 'database' as const,
          shapes: databaseShapes,
          selectedShape,
          editorialOverride,
        };
      }

      if (selectedInstrument === 'violao' || selectedInstrument === 'guitarra') {
        const fallbackDiagram = getChordDiagram(chord);
        if (fallbackDiagram) {
          return {
            chord,
            kind: 'fallback' as const,
            diagram: fallbackDiagram,
          };
        }
      }

      return null;
    })
    .filter((item): item is VisibleChordCard => Boolean(item)), [
      chordOverrides,
      chordShapeVariants,
      chords,
      limit,
      selectedInstrument,
      selectedKey,
      selectedShapeIds,
    ]);

  if (visibleChordCards.length === 0) {
    return null;
  }

  return (
    <div className={`mb-7 -mx-1 print:hidden sm:mx-0 sm:mb-6 ${className}`}>
      <div className="mb-3 hidden items-center justify-between gap-3 sm:flex">
        <div>
          <h2 className="text-base font-semibold text-white">Dicionário de acordes</h2>
          <p className="text-xs text-gray-400">
            Visualização rápida dos acordes detectados para {instrumentLabel}.
          </p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {visibleChordCards.map((item) => (
          item.kind === 'database' ? (
            <DatabaseChordShapeCard
              key={`${item.chord}-${item.selectedShape.id}`}
              chord={item.chord}
              shapes={item.shapes}
              selectedShapeId={item.selectedShape.id}
              onSelectShape={onSelectShape}
              leftHanded={leftHanded}
              editorialOverride={item.editorialOverride}
              matchOptions={{
                preferredKey: selectedKey,
                originalKey,
                progression: chords,
              }}
            />
          ) : (
            <div key={item.chord} className="flex-shrink-0 text-center">
              <ChordDiagramSVG diagram={item.diagram} leftHanded={leftHanded} />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ChordDictionaryCarousel;
