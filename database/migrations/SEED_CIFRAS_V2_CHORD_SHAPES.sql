-- =============================================
-- Migration: SEED_CIFRAS_V2_CHORD_SHAPES
-- Description: Seed inicial de shapes do modulo cifras v2
-- Safe to run multiple times
-- =============================================

do $$
begin
  if to_regclass('public.cifra_chord_shapes') is null then
    raise exception 'Missing base module: run CREATE_CIFRAS_V2_MODULE.sql before SEED_CIFRAS_V2_CHORD_SHAPES.sql';
  end if;
end;
$$;

insert into public.cifra_chord_shapes (
  instrument,
  chord_name,
  variation_name,
  fingering,
  base_fret,
  priority,
  is_left_handed_supported,
  is_active
)
values
  -- Violao / Guitarra
  ('violao', 'C', 'default', '{"frets":[-1,3,2,0,1,0],"fingers":[0,3,2,0,1,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'D', 'default', '{"frets":[-1,-1,0,2,3,2],"fingers":[0,0,0,1,3,2],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'E', 'default', '{"frets":[0,2,2,1,0,0],"fingers":[0,2,3,1,0,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'F', 'default', '{"frets":[1,1,2,3,3,1],"fingers":[1,1,2,3,4,1],"barres":[1],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'G', 'default', '{"frets":[3,2,0,0,0,3],"fingers":[2,1,0,0,0,3],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'A', 'default', '{"frets":[-1,0,2,2,2,0],"fingers":[0,0,1,2,3,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'B', 'default', '{"frets":[-1,2,4,4,4,2],"fingers":[0,1,2,3,4,1],"barres":[2],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Am', 'default', '{"frets":[-1,0,2,2,1,0],"fingers":[0,0,2,3,1,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Bm', 'default', '{"frets":[-1,2,4,4,3,2],"fingers":[0,1,3,4,2,1],"barres":[2],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Cm', 'default', '{"frets":[-1,3,5,5,4,3],"fingers":[0,1,3,4,2,1],"barres":[3],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Dm', 'default', '{"frets":[-1,-1,0,2,3,1],"fingers":[0,0,0,2,3,1],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Em', 'default', '{"frets":[0,2,2,0,0,0],"fingers":[0,2,3,0,0,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Fm', 'default', '{"frets":[1,1,1,3,3,1],"fingers":[1,1,1,3,4,1],"barres":[1],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Gm', 'default', '{"frets":[3,1,0,0,3,3],"fingers":[2,1,0,0,3,4],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'Bb', 'default', '{"frets":[-1,1,3,3,3,1],"fingers":[0,1,2,3,4,1],"barres":[1],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('violao', 'C7', 'default', '{"frets":[-1,3,2,3,1,0],"fingers":[0,3,2,4,1,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('violao', 'D7', 'default', '{"frets":[-1,-1,0,2,1,2],"fingers":[0,0,0,2,1,3],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('violao', 'E7', 'default', '{"frets":[0,2,0,1,0,0],"fingers":[0,2,0,1,0,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('violao', 'G7', 'default', '{"frets":[3,2,0,0,0,1],"fingers":[3,2,0,0,0,1],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('violao', 'A7', 'default', '{"frets":[-1,0,2,0,2,0],"fingers":[0,0,1,0,2,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('violao', 'B7', 'default', '{"frets":[-1,2,1,2,0,2],"fingers":[0,2,1,3,0,4],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),

  ('guitarra', 'C', 'default', '{"frets":[-1,3,2,0,1,0],"fingers":[0,3,2,0,1,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'D', 'default', '{"frets":[-1,-1,0,2,3,2],"fingers":[0,0,0,1,3,2],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'E', 'default', '{"frets":[0,2,2,1,0,0],"fingers":[0,2,3,1,0,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'F', 'default', '{"frets":[1,1,2,3,3,1],"fingers":[1,1,2,3,4,1],"barres":[1],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'G', 'default', '{"frets":[3,2,0,0,0,3],"fingers":[2,1,0,0,0,3],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'A', 'default', '{"frets":[-1,0,2,2,2,0],"fingers":[0,0,1,2,3,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'B', 'default', '{"frets":[-1,2,4,4,4,2],"fingers":[0,1,2,3,4,1],"barres":[2],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Am', 'default', '{"frets":[-1,0,2,2,1,0],"fingers":[0,0,2,3,1,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Bm', 'default', '{"frets":[-1,2,4,4,3,2],"fingers":[0,1,3,4,2,1],"barres":[2],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Cm', 'default', '{"frets":[-1,3,5,5,4,3],"fingers":[0,1,3,4,2,1],"barres":[3],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Dm', 'default', '{"frets":[-1,-1,0,2,3,1],"fingers":[0,0,0,2,3,1],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Em', 'default', '{"frets":[0,2,2,0,0,0],"fingers":[0,2,3,0,0,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Fm', 'default', '{"frets":[1,1,1,3,3,1],"fingers":[1,1,1,3,4,1],"barres":[1],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Gm', 'default', '{"frets":[3,1,0,0,3,3],"fingers":[2,1,0,0,3,4],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'Bb', 'default', '{"frets":[-1,1,3,3,3,1],"fingers":[0,1,2,3,4,1],"barres":[1],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 100, true, true),
  ('guitarra', 'C7', 'default', '{"frets":[-1,3,2,3,1,0],"fingers":[0,3,2,4,1,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('guitarra', 'D7', 'default', '{"frets":[-1,-1,0,2,1,2],"fingers":[0,0,0,2,1,3],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('guitarra', 'E7', 'default', '{"frets":[0,2,0,1,0,0],"fingers":[0,2,0,1,0,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('guitarra', 'G7', 'default', '{"frets":[3,2,0,0,0,1],"fingers":[3,2,0,0,0,1],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('guitarra', 'A7', 'default', '{"frets":[-1,0,2,0,2,0],"fingers":[0,0,1,0,2,0],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),
  ('guitarra', 'B7', 'default', '{"frets":[-1,2,1,2,0,2],"fingers":[0,2,1,3,0,4],"barres":[],"stringCount":6,"tuning":"E A D G B E"}'::jsonb, 1, 90, true, true),

  -- Ukulele
  ('ukulele', 'C', 'default', '{"frets":[0,0,0,3],"fingers":[0,0,0,3],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'D', 'default', '{"frets":[2,2,2,0],"fingers":[1,2,3,0],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'E', 'default', '{"frets":[1,4,0,2],"fingers":[1,4,0,2],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'F', 'default', '{"frets":[2,0,1,0],"fingers":[2,0,1,0],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'G', 'default', '{"frets":[0,2,3,2],"fingers":[0,1,3,2],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'A', 'default', '{"frets":[2,1,0,0],"fingers":[2,1,0,0],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'Bb', 'default', '{"frets":[3,2,1,1],"fingers":[3,2,1,1],"barres":[1],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'B', 'default', '{"frets":[4,3,2,2],"fingers":[4,3,1,1],"barres":[2],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'Am', 'default', '{"frets":[2,0,0,0],"fingers":[2,0,0,0],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'Bm', 'default', '{"frets":[4,2,2,2],"fingers":[3,1,1,1],"barres":[2],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'Cm', 'default', '{"frets":[0,3,3,3],"fingers":[0,1,2,3],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'Dm', 'default', '{"frets":[2,2,1,0],"fingers":[2,3,1,0],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'Em', 'default', '{"frets":[0,4,3,2],"fingers":[0,3,2,1],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'Fm', 'default', '{"frets":[1,0,1,3],"fingers":[1,0,2,4],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 80, true, true),
  ('ukulele', 'Gm', 'default', '{"frets":[0,2,3,1],"fingers":[0,2,3,1],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 80, true, true),
  ('ukulele', 'C7', 'default', '{"frets":[0,0,0,1],"fingers":[0,0,0,1],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'D7', 'default', '{"frets":[2,2,2,3],"fingers":[1,1,1,3],"barres":[2],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'E7', 'default', '{"frets":[1,2,0,2],"fingers":[1,2,0,3],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),
  ('ukulele', 'G7', 'default', '{"frets":[0,2,1,2],"fingers":[0,2,1,3],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'A7', 'default', '{"frets":[0,1,0,0],"fingers":[0,1,0,0],"barres":[],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 100, true, true),
  ('ukulele', 'B7', 'default', '{"frets":[2,3,2,2],"fingers":[1,3,1,1],"barres":[2],"stringCount":4,"tuning":"G C E A"}'::jsonb, 1, 90, true, true),

  -- Cavaco / Teclado: resumo tonal inicial via notas
  ('cavaco', 'C', 'default', '{"notes":["C","E","G"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'D', 'default', '{"notes":["D","F#","A"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'E', 'default', '{"notes":["E","G#","B"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'F', 'default', '{"notes":["F","A","C"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'G', 'default', '{"notes":["G","B","D"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'A', 'default', '{"notes":["A","C#","E"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Bb', 'default', '{"notes":["Bb","D","F"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'B', 'default', '{"notes":["B","D#","F#"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Am', 'default', '{"notes":["A","C","E"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Bm', 'default', '{"notes":["B","D","F#"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Cm', 'default', '{"notes":["C","Eb","G"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Dm', 'default', '{"notes":["D","F","A"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Em', 'default', '{"notes":["E","G","B"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Fm', 'default', '{"notes":["F","Ab","C"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'Gm', 'default', '{"notes":["G","Bb","D"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'C7', 'default', '{"notes":["C","E","G","Bb"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'D7', 'default', '{"notes":["D","F#","A","C"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'E7', 'default', '{"notes":["E","G#","B","D"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'G7', 'default', '{"notes":["G","B","D","F"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'A7', 'default', '{"notes":["A","C#","E","G"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),
  ('cavaco', 'B7', 'default', '{"notes":["B","D#","F#","A"],"tuning":"D G B D"}'::jsonb, 1, 70, false, true),

  ('teclado', 'C', 'default', '{"notes":["C","E","G"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'D', 'default', '{"notes":["D","F#","A"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'E', 'default', '{"notes":["E","G#","B"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'F', 'default', '{"notes":["F","A","C"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'G', 'default', '{"notes":["G","B","D"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'A', 'default', '{"notes":["A","C#","E"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Bb', 'default', '{"notes":["Bb","D","F"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'B', 'default', '{"notes":["B","D#","F#"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Am', 'default', '{"notes":["A","C","E"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Bm', 'default', '{"notes":["B","D","F#"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Cm', 'default', '{"notes":["C","Eb","G"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Dm', 'default', '{"notes":["D","F","A"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Em', 'default', '{"notes":["E","G","B"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Fm', 'default', '{"notes":["F","Ab","C"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'Gm', 'default', '{"notes":["G","Bb","D"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'C7', 'default', '{"notes":["C","E","G","Bb"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'D7', 'default', '{"notes":["D","F#","A","C"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'E7', 'default', '{"notes":["E","G#","B","D"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'G7', 'default', '{"notes":["G","B","D","F"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'A7', 'default', '{"notes":["A","C#","E","G"],"handing":"mao direita"}'::jsonb, 1, 80, false, true),
  ('teclado', 'B7', 'default', '{"notes":["B","D#","F#","A"],"handing":"mao direita"}'::jsonb, 1, 80, false, true)
on conflict (instrument, chord_name, variation_name)
do update set
  fingering = excluded.fingering,
  base_fret = excluded.base_fret,
  priority = excluded.priority,
  is_left_handed_supported = excluded.is_left_handed_supported,
  is_active = excluded.is_active,
  updated_at = now();
