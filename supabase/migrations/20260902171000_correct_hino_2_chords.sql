-- Corrige e simplifica o Hino 2, mantendo apenas transições harmônicas úteis.
-- O mesmo conteúdo canônico é compartilhado por violão, ukulele e teclado.
UPDATE public.cifras
SET
  content = $cifra$
C             G       F      G  C
De Deus tu és eleita, igreja de Jesus,
      E7     F        Dm     C  G
O teu divino Mestre à glória te conduz;
   C             F   C      Am    A7      Dm
Prepara-te, pois E - le mui breve volta...rá;
  C             F       G            C
A glória que te espera já preparada está.

    C          G       F        G   C
Com celestiais adornos espera o teu Senhor,
        E7 F       Dm C         G
Vestida de justiça e do divino amor;
  C          F C         Am   A7 Dm
Dileta és de Cristo, que vida te doou;
  C      F            G          C
A fim de resgatar-te, Seu sangue derramou.

  C          G       F      G  C
É grande tua glória, igreja de Jesus;
         E7 F    Dm      C   G
Consagra-te a Ele, andando em Sua luz;
   C          F C     Am      A7  Dm
Em breve, no Seu reino, gloriosa entrarás,
    C         F         G            C
E a face do Esposo, no céu, contemplarás.
$cifra$,
  updated_at = now()
WHERE slug IN (
  'hino-2-ccb-de-deus-tu-es-eleita',
  'hino-2-ccb-de-deus-tu-es-eleita-ukulele',
  'hino-2-ccb-de-deus-tu-es-eleita-teclado'
);
