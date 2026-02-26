import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Share2, FileText, ChevronUp, Music, Plus, Copyright } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import usePlaylistsStore from '@/stores/playlistsStore';
import useCopyrightClaimsStore from '@/stores/copyrightClaimsStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AlertModal from '@/components/ui/AlertModal';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import AlbumTrackList from '@/components/player/AlbumTrackList';
import FSPHeaderMenu from '@/components/player/FSPHeaderMenu';
import LyricsOverlay from '@/components/player/LyricsOverlay';
import ShareOverlay from '@/components/player/ShareOverlay';
import AddToPlaylistOverlay from '@/components/player/AddToPlaylistOverlay';
import CreatePlaylistOverlay from '@/components/player/CreatePlaylistOverlay';
import InfoOverlay from '@/components/player/InfoOverlay';
import ClaimOverlay from '@/components/player/ClaimOverlay';
import CifrasOverlay from '@/components/player/CifrasOverlay';
import PlayerControls from '@/components/player/PlayerControls';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { buildHinoUrl, buildAlbumCoverUrl } from '@/lib/media-helper';
import * as playlistsApi from '@/lib/playlistsApi';
import { useState, useEffect } from 'react';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenPlayer({ isOpen, onClose }: FullScreenPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    play,
    pause,
    resume,
    next,
    previous,
    setVolume,
    setCurrentTime,
    repeat: storeRepeat,
    setRepeat,
    shuffle: storeShuffle,
    toggleShuffle,
    playNext,
    setOnTrackEnd,
    playbackContext,
  } = usePlayerStore();

  const navigate = useNavigate();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { playlists, addTrackToPlaylist, upsertPlaylist, removeTrackFromPlaylist } = usePlaylistsStore();
  const { createClaim } = useCopyrightClaimsStore();
  const { user, profile } = useAuth();
  const { playerTheme } = usePlayerContext();
  const { showToast } = useToast();

  const handleRemoveTrackFromPlaylistListItem = async (listTrack: any) => {
    if (!playbackContext || playbackContext.type !== 'playlist') return;
    const playlistId = playbackContext.id || '';
    const playlist = playlists.find(p => String(p.id) === String(playlistId));
    if (!playlist) return;
    const pTrack = playlist.tracks.find(t => String(t.backendTrackId || t.id) === String(listTrack.id));
    if (!pTrack) return;
    const ok = window.confirm(`Remover "${pTrack.title}" da playlist "${playlist.name}"?`);
    if (!ok) return;
    try {
      const isNumeric = /^\d+$/.test(String(playlistId));
      const backendId = pTrack.backendTrackId || String(pTrack.id);
      if (isNumeric) {
        await playlistsApi.removeTrack({ playlistId, trackId: backendId });
      }
      removeTrackFromPlaylist(String(playlistId), pTrack.id);
      showToast('success', 'Removido da playlist', `"${pTrack.title}" foi removida de "${playlist.name}".`);
    } catch (e) {
      console.error('Erro ao remover da playlist:', e);
      showToast('error', 'Erro ao remover', 'Não foi possível remover a faixa. Tente novamente.');
    }
  };
  
  // Inicializar player de áudio
  
  // Derivar isAuthenticated do user
  const isAuthenticated = !!user && !!profile;
  
  // Tema do player
  const isAlbumTheme = playerTheme === 'album';
  // Faixas do álbum reais: track atual + fila do player
  const albumTracks = isAlbumTheme
    ? ([...(currentTrack ? [currentTrack] : []), ...(queue || [])] as any[])
    : [];

  

  const handleRemoveCurrentFromPlaylist = async () => {
    if (!playbackContext || playbackContext.type !== 'playlist') return;
    const playlistId = playbackContext.id || '';
    const playlist = playlists.find(p => String(p.id) === String(playlistId));
    if (!playlist || !currentTrack) return;
    const track = playlist.tracks.find(t => String(t.id) === String(currentTrack.id));
    if (!track) return;
    const ok = window.confirm(`Remover "${track.title}" da playlist "${playlist.name}"?`);
    if (!ok) return;
    try {
      const isNumeric = /^\d+$/.test(String(playlistId));
      const backendId = track.backendTrackId || String(track.id);
      if (isNumeric) {
        await playlistsApi.removeTrack({ playlistId, trackId: backendId });
      }
      removeTrackFromPlaylist(String(playlistId), track.id);
      showToast('success', 'Removido da playlist', `"${track.title}" foi removida de "${playlist.name}".`);
    } catch (e) {
      console.error('Erro ao remover da playlist:', e);
      showToast('error', 'Erro ao remover', 'Não foi possível remover a faixa. Tente novamente.');
    }
  };

  // Mock data para faixas do álbum com letras (substituir por dados reais)
  const mockAlbumTracks = [
    { 
      id: '1', 
      title: 'Hino 1 - Deus Eterno', 
      artist: 'Coral CCB', 
      duration: '4:33',
      lyrics: `Deus eterno, Deus bendito\nTeu poder é infinito\nTua glória resplandece\nE jamais se escurece\n\nRefrão:\nGlória, glória, aleluia\nGlória ao Rei dos reis\nGlória, glória, aleluia\nPara sempre cantarei`
    },
    { 
      id: '2', 
      title: 'Hino 2 - Vem Pecador', 
      artist: 'Coral CCB', 
      duration: '4:57',
      lyrics: `Vem pecador, Jesus te chama\nVem sem temor, Ele te ama\nVem encontrar a salvação\nEm Cristo há perdão\n\nRefrão:\nVem, vem, vem\nJesus te quer\nVem, vem, vem\nEle é teu amigo fiel`
    },
    { 
      id: '3', 
      title: 'Hino 3 - Ao Deus de Abraão', 
      artist: 'Coral CCB', 
      duration: '4:39',
      lyrics: `Ao Deus de Abraão louvai\nO Deus de Isaque exaltai\nO Deus de Jacó cantai\nEle é o Senhor\n\nRefrão:\nSanto, santo, santo\nÉ o Senhor dos senhores\nSanto, santo, santo\nRei dos reis e Senhor`
    },
    { 
      id: '4', 
      title: 'Hino 4 - Saudosa Lembrança', 
      artist: 'Coral CCB', 
      duration: '3:47',
      lyrics: `Saudosa lembrança\nDo tempo que passou\nQuando em oração\nMeu coração se alegrou\n\nRefrão:\nDoce lembrança\nDaqueles dias\nQuando sentia\nAs bênçãos de Deus`
    },
    { 
      id: '5', 
      title: 'Hino 5 - Jerusalém Celeste', 
      artist: 'Coral CCB', 
      duration: '4:27',
      lyrics: `Jerusalém celeste\nCidade do grande Rei\nLá não há tristeza\nNem dor, nem lei\n\nRefrão:\nQuero ir, quero ir\nPara aquela cidade\nQuero ir, quero ir\nOnde há felicidade`
    },
    { 
      id: '6', 
      title: 'Hino 6 - Deus Eterno', 
      artist: 'Coral CCB', 
      duration: '4:25',
      lyrics: `Deus eterno, Deus bendito\nTeu poder é infinito\nTua glória resplandece\nE jamais se escurece`
    },
    { 
      id: '7', 
      title: 'Hino 7 - Vem Pecador', 
      artist: 'Coral CCB', 
      duration: '4:23',
      lyrics: `Vem pecador, Jesus te chama\nVem sem temor, Ele te ama\nVem encontrar a salvação\nEm Cristo há perdão`
    },
    { 
      id: '8', 
      title: 'Hino 8 - Ao Deus de Abraão', 
      artist: 'Coral CCB', 
      duration: '3:35',
      lyrics: `Ao Deus de Abraão louvai\nO Deus de Isaque exaltai\nO Deus de Jacó cantai\nEle é o Senhor`
    },
    { 
      id: '9', 
      title: 'Hino 9 - Saudosa Lembrança', 
      artist: 'Coral CCB', 
      duration: '4:12',
      lyrics: `Saudosa lembrança\nDo tempo que passou\nQuando em oração\nMeu coração se alegrou`
    },
    { 
      id: '10', 
      title: 'Hino 10 - Jerusalém Celeste', 
      artist: 'Coral CCB', 
      duration: '3:58',
      lyrics: `Jerusalém celeste\nCidade do grande Rei\nLá não há tristeza\nNem dor, nem lei`
    },
  ];
  
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCifrasModal, setShowCifrasModal] = useState(false);
  const [showCopyrightClaim, setShowCopyrightClaim] = useState(false);
  const [claimType, setClaimType] = useState<'composer' | 'author' | 'both'>('composer');
  const [claimDescription, setClaimDescription] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  
  // Modais customizados
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNonComposerAlert, setShowNonComposerAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPlaylistSuccess, setShowPlaylistSuccess] = useState(false);
  
  // Modais de download
  const [showDownloadLoginAlert, setShowDownloadLoginAlert] = useState(false);
  const [showDownloadNotAvailableAlert, setShowDownloadNotAvailableAlert] = useState(false);
  const [playlistSuccessMessage, setPlaylistSuccessMessage] = useState('');

  const isLiked = currentTrack ? isFavorite(parseInt(currentTrack.id)) : false;

  // Debug: Monitorar favoritos
  useEffect(() => {
    if (currentTrack) {
      console.log('💚 Estado de Favoritos:');
      console.log('  - currentTrack.id:', currentTrack.id);
      console.log('  - isLiked:', isLiked);
      console.log('  - user:', user?.id);
    }
  }, [currentTrack?.id, isLiked, user?.id]);

  // Debug: Monitorar estado de autenticação
  useEffect(() => {
    console.log('🔐 Estado de Autenticação (AuthContext):');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user:', user);
    console.log('  - profile:', profile);
    console.log('  - user.role:', profile?.is_admin ? 'admin' : (profile?.is_composer ? 'composer' : 'user'));
  }, [isAuthenticated, user, profile]);

  // Verificar se deve abrir formulário automaticamente (via URL)
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !currentTrack) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenClaim = urlParams.get('openClaim') === 'true';
    
    if (shouldOpenClaim) {
      const userRole = (profile?.is_admin ? 'admin' : (profile?.is_composer ? 'composer' : 'user')) as 'admin' | 'composer' | 'user';
      if (userRole === 'composer' || userRole === 'admin') {
        setShowCopyrightClaim(true);
        // Limpar parâmetro da URL
        urlParams.delete('openClaim');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      } else {
        setShowNonComposerAlert(true);
      }
    }
  }, [isOpen, isAuthenticated, currentTrack, user]);

  // Simular progresso do hino
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        const newTime = currentTime + 1;
        
        // Se chegou ao final
        if (newTime >= duration) {
          playNext(); // Chama função que trata repeat
        } else {
          setCurrentTime(newTime);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, playNext, setCurrentTime]);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMenu && !target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (value: number) => {
    const newTime = (value / 100) * duration;
    setCurrentTime(newTime);
  };

  const handleRepeatToggle = () => {
    if (storeRepeat === 'none') {
      setRepeat('all');
    } else if (storeRepeat === 'all') {
      setRepeat('one');
    } else {
      setRepeat('none');
    }
  };

  const handleShare = async () => {
    // Verificar se usuário está logado
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentTrack.title,
          text: `Ouça ${currentTrack.title} - ${currentTrack.artist}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareMenu(false);
    showToast('info', 'Link copiado', 'O link foi copiado para a área de transferência.');
  };

  const shareWhatsApp = () => {
    const text = `Ouça ${currentTrack.title} - ${currentTrack.artist}\n${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareMenu(false);
  };

  const shareEmail = () => {
    const subject = `Ouça: ${currentTrack.title}`;
    const body = `Olá!\n\nGostaria de compartilhar este hino com você:\n\n${currentTrack.title} - ${currentTrack.artist}\n\n${window.location.href}\n\nAproveite!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setShowShareMenu(false);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    if (!user?.id) {
      setShowLoginModal(true);
      return;
    }
    try {
      const created = await playlistsApi.create({
        userId: Number(user.id),
        name: newPlaylistName,
        description: newPlaylistDescription,
        coverUrl: '',
        isPublic: true,
      });

      // Upsert no store
      upsertPlaylist({
        id: String(created.id),
        name: created.name,
        description: created.description || undefined,
        coverUrl: created.cover_url || `https://picsum.photos/seed/${created.id}/300/300`,
        tracks: [],
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      });

      // Adicionar faixa atual na playlist recém criada (backend + store)
      await playlistsApi.addTrack({
        playlistId: created.id,
        trackId: currentTrack.id,
        title: currentTrack.title,
        artist: currentTrack.artist,
        duration: currentTrack.duration || '0:00',
        coverUrl: currentTrack.coverUrl,
      });

      addTrackToPlaylist(String(created.id), {
        id: parseInt(currentTrack.id),
        title: currentTrack.title,
        artist: currentTrack.artist,
        coverUrl: currentTrack.coverUrl,
        duration: currentTrack.duration || '0:00'
      });

      // Resetar e fechar
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreatePlaylist(false);
      setShowAddToPlaylist(false);

      // Feedback
      setPlaylistSuccessMessage(`Playlist "${created.name}" criada com sucesso!\nHino adicionado.`);
      setShowPlaylistSuccess(true);
    } catch (e) {
      console.error('Erro ao criar playlist:', e);
      setShowCreatePlaylist(false);
      setShowAddToPlaylist(false);
    }
  };

  const handleAddToExistingPlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    try {
      const isNumeric = /^\d+$/.test(String(playlistId));
      if (isNumeric) {
        await playlistsApi.addTrack({
          playlistId,
          trackId: currentTrack.id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          coverUrl: currentTrack.coverUrl,
          duration: currentTrack.duration || '0:00'
        });
      }

      addTrackToPlaylist(playlistId, {
        id: parseInt(currentTrack.id),
        title: currentTrack.title,
        artist: currentTrack.artist,
        coverUrl: currentTrack.coverUrl,
        duration: currentTrack.duration || '0:00'
      });

      setShowAddToPlaylist(false);

      if (playlist) {
        setPlaylistSuccessMessage(`"${currentTrack.title}" adicionada à playlist "${playlist.name}"!`);
        setShowPlaylistSuccess(true);
      }
    } catch (e) {
      console.error('Erro ao adicionar à playlist:', e);
    }
  };

  const handleDownload = () => {
    console.log('🔽 Tentativa de download:', {
      isAuthenticated,
      user: !!user,
      downloadEnabled: (currentTrack as any)?.allow_download
    });

    // Verificar se usuário está logado
    if (!isAuthenticated || !user) {
      console.log('❌ Usuário não autenticado - mostrando modal de login');
      setShowDownloadLoginAlert(true);
      setShowMenu(false);
      return;
    }

    // Verificar se download está habilitado para este hino
    const downloadEnabled = (currentTrack as any)?.allow_download !== undefined 
      ? Boolean((currentTrack as any).allow_download) 
      : false;

    if (!downloadEnabled) {
      console.log('❌ Download não permitido para este hino');
      setShowDownloadNotAvailableAlert(true);
      setShowMenu(false);
      return;
    }

    // Download permitido - realizar download
    console.log('✅ Download permitido - iniciando...');
    const link = document.createElement('a');
    link.href = currentTrack.audioUrl || '#';
    link.download = `${currentTrack.title} - ${currentTrack.artist}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowMenu(false);
  };

  const handleShowInfo = () => {
    setShowMenu(false);
    setShowInfoModal(true);
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!claimDescription.trim()) {
      showToast('warning', 'Descrição obrigatória', 'Por favor, descreva sua reivindicação.');
      return;
    }

    // Criar reivindicação
    const newClaim = createClaim({
      songId: parseInt(currentTrack.id),
      songTitle: currentTrack.title,
      songArtist: currentTrack.artist,
      songCoverUrl: currentTrack.coverUrl,
      composerId: String(user?.id || 'unknown'),
      composerName: (profile as any)?.name || 'Usuário',
      composerEmail: (profile as any)?.email || (user as any)?.email || '',
      claimType,
      description: claimDescription,
      priority: 'medium',
      hasUnreadForAdmin: true,
      hasUnreadForComposer: false
    });

    // Limpar formulário
    setClaimType('composer');
    setClaimDescription('');
    setShowCopyrightClaim(false);

    // Mostrar modal de sucesso
    setSuccessMessage(`Número do protocolo: ${newClaim.id}\n\nNossa equipe analisará sua solicitação e entrará em contato em breve.\nVocê pode acompanhar o status em "Minhas Reivindicações" no menu do compositor.`);
    setShowSuccessAlert(true);
  };

  const handleCopyrightClaim = () => {
    console.log('=== VERIFICAÇÃO DE AUTH ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('profile:', profile);
    
    // Verificar se usuário está logado
    if (!isAuthenticated || !user || !profile) {
      console.log('❌ Usuário não autenticado - mostrando modal de login');
      
      // Salvar contexto em sessionStorage para reabrir após login
      sessionStorage.setItem('pendingCopyrightClaim', JSON.stringify({
        songId: currentTrack.id,
        songTitle: currentTrack.title,
        songArtist: currentTrack.artist,
        songCoverUrl: currentTrack.coverUrl,
        timestamp: new Date().toISOString()
      }));
      
      // Mostrar modal de login primeiro
      setShowLoginModal(true);
      return;
    }
    
    // Usuário está logado - verificar role
    console.log('✅ Usuário logado! Verificando role...');
    const isComposer = profile.is_composer || false;
    const isAdmin = profile.is_admin || false;
    console.log('Role do usuário - Compositor:', isComposer, '| Admin:', isAdmin);
    
    if (isComposer || isAdmin) {
      console.log('✅ Usuário é compositor/admin - abrindo formulário');
      setShowMenu(false);
      setShowCopyrightClaim(true);
    } else {
      console.log('⚠️ Usuário comum - mostrando alerta informativo');
      setShowNonComposerAlert(true);
    }
  };

  // Função para selecionar uma faixa da lista
  const handleTrackSelect = (track: any) => {
    const resolvedAudioUrl = track.audioUrl
      ? track.audioUrl
      : buildHinoUrl({ id: String(track.id), audio_url: track.audio_url });
    const trackData = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      coverUrl: currentTrack?.coverUrl || 'https://picsum.photos/400/400',
      audioUrl: resolvedAudioUrl,
      album: (currentTrack as any)?.album || 'Hinário 5 - Completo',
      lyrics: track.lyrics || 'Letra não disponível para este hino.'
    };

    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      // Se for tema de álbum, ativar repeat automaticamente
      if (isAlbumTheme && storeRepeat === 'none') {
        setRepeat('all');
      }
      play(trackData as any);
    }
  };

  // Função para favoritar faixa da lista
  const handleToggleFavoriteTrack = (trackId: string) => {
    const id = parseInt(trackId);
    const track = albumTracks.find(t => String(t.id) === String(trackId));
    
    const uid = user?.id ? Number(user.id) : undefined;
    if (isFavorite(id)) {
      removeFavorite(id, uid);
    } else if (track) {
      addFavorite({
        id,
        title: track.title,
        artist: track.artist,
        album: (currentTrack as any)?.album || 'Hinário 5 - Completo',
        duration: track.duration,
        coverUrl: currentTrack?.coverUrl || 'https://picsum.photos/400/400'
      }, uid);
    }
  };


  // Função para próxima faixa (integrada com controles)
  const handleNextTrack = () => {
    next();
  };

  // Função para faixa anterior (integrada com controles)
  const handlePreviousTrack = () => {
    previous();
  };

  


  // State para controlar se já executou a troca automática
  const [autoSwitched, setAutoSwitched] = useState(false);

  // Effect para troca automática quando faixa termina
  useEffect(() => {
    // Só funciona para álbuns, quando está tocando, tem tempo válido e chegou perto do fim
    if (isAlbumTheme && isPlaying && currentTime > 0 && duration > 0 && !autoSwitched) {
      const percentage = (currentTime / duration) * 100;
      // Se chegou a 99.5% do hino, pedir próximo via store
      if (percentage >= 99.5) {
        setAutoSwitched(true);
        playNext();
      }
    }
  }, [currentTime, duration, isPlaying, isAlbumTheme, currentTrack?.id, autoSwitched, storeRepeat]);

  // Reset do autoSwitch quando muda de faixa
  useEffect(() => {
    setAutoSwitched(false);
  }, [currentTrack?.id]);

  // Verificar se há reivindicação pendente após login
  useEffect(() => {
    if (isAuthenticated && user && profile) {
      const pendingClaim = sessionStorage.getItem('pendingCopyrightClaim');
      if (pendingClaim) {
        console.log('✅ Login detectado - abrindo modal de copyright claim pendente');
        sessionStorage.removeItem('pendingCopyrightClaim');
        setShowLoginModal(false);
        
        // Verificar se é compositor/admin antes de abrir
        const isComposer = profile.is_composer || false;
        const isAdmin = profile.is_admin || false;
        
        if (isComposer || isAdmin) {
          setShowCopyrightClaim(true);
        } else {
          setShowNonComposerAlert(true);
        }
      }
    }
  }, [isAuthenticated, user, profile]);

  const coverSrc = (() => {
    const raw = currentTrack?.coverUrl || '';
    try {
      if (!raw) return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTrack.title)}&background=1f2937&color=ffffff`;
      if (raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
      return buildAlbumCoverUrl({ id: String(currentTrack.id), cover_url: raw });
    } catch {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTrack.title)}&background=1f2937&color=ffffff`;
    }
  })();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop para garantir cobertura total */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99] bg-black backdrop-blur-md"
            />
            {/* Album Tracklist - Só aparece se for tema de álbum */}
            {isAlbumTheme && (
              <AlbumTrackList
                tracks={albumTracks as any[]}
                currentTrack={currentTrack as any}
                isPlaying={isPlaying}
                onSelect={handleTrackSelect}
                playbackContext={playbackContext}
                onRemoveFromPlaylist={handleRemoveTrackFromPlaylistListItem}
              />
            )}
            <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed inset-0 z-[100] overflow-y-auto pb-20 ${
              isAlbumTheme 
                ? 'bg-gradient-to-b from-purple-900/95 via-purple-950/98 to-black' 
                : 'bg-gradient-to-b from-green-900/95 via-green-800/98 to-black'
            }`}
          >
          {/* Header */}
          <FSPHeaderMenu
            isAlbumTheme={isAlbumTheme}
            currentTrack={currentTrack}
            onClose={onClose}
            showMenu={showMenu}
            onToggleMenu={() => setShowMenu(!showMenu)}
            onOpenAddToPlaylist={() => { setShowAddToPlaylist(true); setShowMenu(false); }}
            onShare={() => { handleShare(); setShowMenu(false); }}
            onDownload={() => { handleDownload(); setShowMenu(false); }}
            onShowInfo={() => { handleShowInfo(); setShowMenu(false); }}
            canDownload={('allow_download' in (currentTrack as any)) ? (currentTrack as any).allow_download !== false : true}
            isPlaylistContext={playbackContext?.type === 'playlist'}
            onRemoveFromPlaylist={() => { handleRemoveCurrentFromPlaylist(); setShowMenu(false); }}
          />

          {/* Album Art - Centralizado e Grande */}
          <div className="flex items-center justify-center px-8 py-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <img
                src={coverSrc}
                alt={currentTrack.title}
                className="w-56 h-56 rounded-3xl shadow-2xl object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTrack.title)}&background=1f2937&color=ffffff`; }}
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Ícone Pause Flutuante - Só quando está tocando */}
              {isPlaying && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="p-4 bg-black/60 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors">
                    <Pause className="w-8 h-8 text-white" />
                  </div>
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Track Info */}
          <div className="px-8 py-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {currentTrack.title}
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-base text-gray-300"
                >
                  {currentTrack.artist}
                </motion.p>
              </div>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                onClick={() => {
                  // Verificar se o usuário está logado
                  if (!user) {
                    setShowLoginModal(true);
                    return;
                  }

                  const currentId = parseInt(currentTrack.id);
                  const uid = user?.id ? Number(user.id) : undefined;
                  if (isLiked) {
                    removeFavorite(currentId, uid);
                  } else {
                    addFavorite({
                      id: currentId,
                      title: currentTrack.title,
                      artist: currentTrack.artist,
                      album: 'album' in currentTrack ? (currentTrack as any).album : 'Álbum Desconhecido',
                      duration: currentTrack.duration || '0:00',
                      coverUrl: currentTrack.coverUrl
                    }, uid);
                  }
                }}
                className="p-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <Heart
                  className={`w-7 h-7 transition-colors ${
                    isLiked ? 'fill-red-500 text-red-500' : 'text-white'
                  }`}
                />
              </motion.button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 py-4">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3
                  [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 180)}</span>
            </div>
          </div>

          {/* Controls + Actions */}
          <div className="px-8 py-0">
            <PlayerControls
              isAlbumTheme={isAlbumTheme}
              storeShuffle={storeShuffle}
              onToggleShuffle={toggleShuffle}
              onPrevious={handlePreviousTrack}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNextTrack}
              storeRepeat={storeRepeat}
              onRepeatToggle={handleRepeatToggle}
              onAddToPlaylist={() => setShowAddToPlaylist(true)}
              onShowCifras={() => setShowCifrasModal(true)}
              onClaim={handleCopyrightClaim}
              onShare={handleShare}
            />

            {/* Lyrics Button */}
            <button
              onClick={() => setShowLyrics(true)}
              className="w-full flex items-center justify-between px-4 py-3 mt-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Letra</span>
              </div>
              <ChevronUp className="w-5 h-5 text-white" />
            </button>
          </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lyrics Overlay */}
      <LyricsOverlay
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        currentTrack={currentTrack as any}
        isAlbumTheme={isAlbumTheme}
      />

      {/* Share Overlay */}
      <ShareOverlay
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        onCopyLink={copyLink}
        onShareWhatsApp={shareWhatsApp}
        onShareEmail={shareEmail}
      />

      {/* Add to Playlist Overlay */}
      <AddToPlaylistOverlay
        isOpen={showAddToPlaylist}
        playlists={playlists as any}
        onClose={() => setShowAddToPlaylist(false)}
        onOpenCreate={() => { setShowCreatePlaylist(true); setShowAddToPlaylist(false); }}
        onSelectPlaylist={(pid) => handleAddToExistingPlaylist(pid)}
      />

      {/* Create New Playlist Overlay */}
      <CreatePlaylistOverlay
        isOpen={showCreatePlaylist}
        name={newPlaylistName}
        description={newPlaylistDescription}
        onChangeName={setNewPlaylistName}
        onChangeDescription={setNewPlaylistDescription}
        onSubmit={handleCreatePlaylist}
        onClose={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); setNewPlaylistDescription(''); }}
      />

      {/* Info Overlay */}
      <InfoOverlay
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        currentTrack={currentTrack as any}
      />

      {/* Cifras Overlay */}
      <CifrasOverlay
        isOpen={showCifrasModal}
        onClose={() => setShowCifrasModal(false)}
        currentTrack={currentTrack as any}
      />

      {/* Copyright Claim Overlay */}
      <ClaimOverlay
        isOpen={showCopyrightClaim}
        onClose={() => {
          setShowCopyrightClaim(false);
          setClaimType('composer');
          setClaimDescription('');
        }}
        currentTrack={currentTrack as any}
        claimType={claimType}
        onChangeClaimType={(v) => setClaimType(v)}
        claimDescription={claimDescription}
        onChangeClaimDescription={setClaimDescription}
        onSubmit={handleSubmitClaim}
      />

      {/* Modal de Login */}
      <ConfirmModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onConfirm={() => {
          navigate('/login');
        }}
        title=""
        message="Para continuar com esta ação você precisa estar logado. Deseja fazer login agora?"
        confirmText="OK"
        cancelText="Cancelar"
        confirmColor="green"
        songTitle={currentTrack?.title}
        songArtist={currentTrack?.artist}
        songCover={currentTrack?.coverUrl}
      />

      {/* Modal de Alerta para Não-Compositores */}
      <AlertModal
        isOpen={showNonComposerAlert}
        onClose={() => setShowNonComposerAlert(false)}
        title="Atenção"
        message={`Caro(a) ${(profile as any)?.name || 'Usuário'},\n\nEntendemos o quanto é frustrante ter um conteúdo publicado sem a sua permissão e já adiantamos que estamos de prontidão para resolver esse problema o mais breve possível.\n\nPorém só conseguimos acelerar o processo de verificação se o seu perfil for de Compositor, caso contrário, iremos analisar e respondê-lo(a) assim que possível.\n\nCaso deseje dar continuidade, favor encaminhar um e-mail para:\ndireitosautorais@canticosccb.com.br\n\nIncluindo:\n• URL da faixa ou álbum\n• Informações que comprovem a autoria do conteúdo`}
        type="warning"
        buttonText="Entendi"
        buttonColor="amber"
      />

      {/* Modal de Sucesso */}
      <AlertModal
        isOpen={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        title="Reivindicação Enviada"
        message={`✅ Reivindicação enviada com sucesso!\n\n${successMessage}`}
        type="success"
        buttonText="Fechar"
        buttonColor="green"
      />

      {/* Modal - Download sem Login */}
      <AlertModal
        isOpen={showDownloadLoginAlert}
        onClose={() => setShowDownloadLoginAlert(false)}
        title="Login Necessário"
        message="Faça o login para baixar este hino."
        type="warning"
        buttonText="Entendi"
        buttonColor="green"
      />

      {/* Modal - Download Não Disponível */}
      <AlertModal
        isOpen={showDownloadNotAvailableAlert}
        onClose={() => setShowDownloadNotAvailableAlert(false)}
        title="Download Indisponível"
        message="Já estamos trabalhando para o mais breve possível disponibilizar esse recurso. Deus abençoe pela paciência!"
        type="info"
        buttonText="Entendi"
        buttonColor="amber"
      />

      {/* Playlist Success Modal */}
      <AnimatePresence>
        {showPlaylistSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPlaylistSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-green-900 to-black rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Sucesso!</h3>
                <button
                  onClick={() => setShowPlaylistSuccess(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {currentTrack.coverUrl && currentTrack.coverUrl.trim() !== '' ? (
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-20 h-20 rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Music className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">{currentTrack.title}</h4>
                    <p className="text-gray-300">{currentTrack.artist}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-white text-center whitespace-pre-line">
                    {playlistSuccessMessage}
                  </p>
                </div>

                <button
                  onClick={() => setShowPlaylistSuccess(false)}
                  className="w-full mt-6 px-4 py-3 rounded-lg bg-primary-500 hover:bg-primary-400 text-black font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
