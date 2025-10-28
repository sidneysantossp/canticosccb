import React, { useEffect, useRef } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlayerStore } from '@/stores/playerStore';

/**
 * Componente global e sem renderização que inicializa o hook de áudio.
 * Ele garante que a lógica de reprodução de áudio esteja sempre ativa,
 * ouvindo as mudanças na playerStore e controlando a reprodução.
 */
const GlobalAudioPlayer = () => {
  useAudioPlayer();
  return null;
};

export default GlobalAudioPlayer;
