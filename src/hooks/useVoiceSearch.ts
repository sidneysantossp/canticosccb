import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface UseVoiceSearchOptions {
  lang?: string;
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void;
}

const VOICE_ERRORS: Record<string, string> = {
  'not-allowed': 'Permissão de microfone negada.',
  'service-not-allowed': 'A captura por voz não está disponível neste navegador.',
  'no-speech': 'Nenhuma fala foi detectada.',
  'audio-capture': 'Não foi possível acessar o microfone.',
  aborted: 'A captura por voz foi interrompida.',
  network: 'Falha de rede ao processar a voz.',
};

export function useVoiceSearch(options: UseVoiceSearchOptions = {}) {
  const { lang = 'pt-BR', onFinalResult, onInterimResult } = options;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const recognitionCtor = useMemo<SpeechRecognitionCtor | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  const supported = Boolean(recognitionCtor);

  useEffect(() => {
    if (!recognitionCtor) return;

    const recognition = new recognitionCtor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript?.trim() || '';
        if (!text) continue;
        if (result.isFinal) {
          finalText += `${text} `;
        } else {
          interimText += `${text} `;
        }
      }

      const normalizedInterim = interimText.trim();
      const normalizedFinal = finalText.trim();

      if (normalizedInterim) {
        setTranscript(normalizedInterim);
        onInterimResult?.(normalizedInterim);
      }

      if (normalizedFinal) {
        setTranscript(normalizedFinal);
        onFinalResult?.(normalizedFinal);
      }
    };

    recognition.onerror = (event) => {
      const message = VOICE_ERRORS[event.error || ''] || 'Não foi possível processar a busca por voz.';
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang, onFinalResult, onInterimResult, recognitionCtor]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Busca por voz não é suportada neste navegador.');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch  {
      setError('Não foi possível iniciar a busca por voz.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    supported,
    isListening,
    transcript,
    error,
    clearError: () => setError(null),
    startListening,
    stopListening,
    toggleListening,
  };
}
