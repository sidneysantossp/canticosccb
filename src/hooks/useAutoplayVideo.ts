import { useEffect, useRef } from 'react';

export const useAutoplayVideo = (isActive: boolean = true, src?: string) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    const playVideo = async () => {
      try {
        // Resetar para o início
        video.currentTime = 0;
        // Garantir mudo para políticas de autoplay
        video.muted = true;
        try {
          // Garantir atributos para iOS Safari e mobile
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');
          // @ts-ignore - atributo não tipado no React
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('autoplay', '');
        } catch {}
        // Recarregar quando src muda para garantir estado consistente
        try { if (src) video.load(); } catch {}
        
        // Tentar reproduzir
        await video.play();
        console.log('Vídeo iniciado automaticamente');
      } catch (error) {
        console.log('Autoplay bloqueado pelo navegador:', error);
        
        // Fallback: tentar novamente após interação do usuário
        const handleUserInteraction = async () => {
          try {
            await video.play();
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          } catch (e) {
            console.log('Falha ao reproduzir após interação:', e);
          }
        };

        document.addEventListener('click', handleUserInteraction, { once: true });
        document.addEventListener('touchstart', handleUserInteraction, { once: true });
      }
    };

    // Eventos para garantir reprodução
    const handleLoadedData = () => playVideo();
    const handleCanPlay = () => playVideo();
    const handleVisibility = () => { if (!document.hidden) playVideo(); };
    
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    document.addEventListener('visibilitychange', handleVisibility);

    // Se o vídeo já estiver carregado
    if (video.readyState >= 2) {
      playVideo();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive, src]);

  return videoRef;
};
