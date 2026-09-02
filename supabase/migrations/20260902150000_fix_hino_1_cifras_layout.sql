-- Corrige a importacao em duas colunas do Hino 1 e remove progressões redundantes.
-- A mesma progressão é compartilhada entre os instrumentos; os diagramas continuam
-- sendo definidos separadamente pelo instrumento no frontend.
UPDATE public.cifras
SET
  content = $cifra$
[Hino 1]

C  G  Am  F  C
Cristo, meu Mestre e meu Senhor,
F  C  Am  D7  G
Eu Te adoro, por fé com fervor;
C  G  F  G
Rogo que guardes meu coração;
F  C  G  C
Vem protegê-lo com Tua unção
F  Am  G  C
E defendê-lo, ó meu Guardião.

[2ª estrofe]

C  G  Am  F  C
Mestre divino, sempre senti
F  C  Am  D7  G
Meu coração dependente de Ti;
C  G  F  G
Bom fundamento dá-lhe, Senhor,
F  C  G  C
Dá-lhe firmeza, virtude, valor
F  Am  G  C
E fortaleza, ó meu Protetor.

[3ª estrofe]

C  G  Am  F  C
Vale profundo, cheio de mal,
F  C  Am  D7  G
É este mundo, ó Rei divinal.
C  G  F  G
Só Tua força pode manter
F  C  G  C
Santo e puro, na graça, meu ser,
F  Am  G  C
Sempre seguro, com fé e poder.

[4ª estrofe]

C  G  Am  F  C
Mestre piedoso, com Tua mão,
F  C  Am  D7  G
Faze perfeito o meu coração,
C  G  F  G
Santo, ardoroso em Te servir,
F  C  G  C
Sempre voltado aos bens do porvir;
F  Am  G  C
Mestre amado, desejo Te ouvir.
$cifra$,
  updated_at = now()
WHERE slug IN (
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor',
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor-ukulele',
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor-teclado'
);
