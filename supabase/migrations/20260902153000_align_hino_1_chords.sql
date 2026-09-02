-- Alinha os acordes do Hino 1 aos pontos de transição da letra.
UPDATE public.cifras
SET
  content = $cifra$
[Hino 1]

C           G      F     C
Cristo, meu Mestre e meu Senhor,
F     C          D7     G7
Eu Te adoro, por fé com fervor;
C        G       F   G7
Rogo que guardes meu coração;
F   C              G   C
Vem protegê-lo com Tua unção
F       C Ab    G7        C
E defendê-lo, ó meu Guardião.

[2ª estrofe]

C      G       F      C
Mestre divino, sempre senti
F   C       D7            G7
Meu coração dependente de Ti;
C   G          F       G7
Bom fundamento dá-lhe, Senhor,
F      C        G        C
Dá-lhe firmeza, virtude, valor
F      C Ab    G7       C
E fortaleza, ó meu Protetor.

[3ª estrofe]

C              G        F  C
Vale profundo, cheio de mal,
F      C        D7  G7
É este mundo, ó Rei divinal.
C      G     F    G7
Só Tua força pode manter
F       C        G          C
Santo e puro, na graça, meu ser,
F       C Ab       G7     C
Sempre seguro, com fé e poder.

[4ª estrofe]

C      G        F       C
Mestre piedoso, com Tua mão,
F    C          D7  G7
Faze perfeito o meu coração,
C      G        F     G7
Santo, ardoroso em Te servir,
F      C           G       C
Sempre voltado aos bens do porvir;
F      C Ab    G7         C
Mestre amado, desejo Te ouvir.
$cifra$,
  updated_at = now()
WHERE slug IN (
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor',
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor-ukulele',
  'hino-1-ccb-cristo-meu-mestre-e-meu-senhor-teclado'
);
