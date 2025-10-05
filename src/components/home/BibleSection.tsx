import React from 'react';
import { Play, Book, Clock } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

interface BibleChapter {
  id: number;
  book: string;
  chapter: number;
  title: string;
  duration: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
}

const bibleChapters: BibleChapter[] = [
  {
    id: 1,
    book: "Gênesis",
    chapter: 1,
    title: "A Criação",
    duration: "8:45",
    description: "No princípio criou Deus os céus e a terra...",
    audioUrl: "/audio/genesis-1.mp3",
    coverUrl: "https://picsum.photos/seed/bible1/300/300"
  },
  {
    id: 2,
    book: "Salmos",
    chapter: 23,
    title: "O Senhor é Meu Pastor",
    duration: "3:20",
    description: "O SENHOR é o meu pastor; nada me faltará...",
    audioUrl: "/audio/salmos-23.mp3",
    coverUrl: "https://picsum.photos/seed/bible2/300/300"
  },
  {
    id: 3,
    book: "João",
    chapter: 3,
    title: "O Novo Nascimento",
    duration: "12:15",
    description: "E havia entre os fariseus um homem, chamado Nicodemos...",
    audioUrl: "/audio/joao-3.mp3",
    coverUrl: "https://picsum.photos/seed/bible3/300/300"
  },
  {
    id: 4,
    book: "1 Coríntios",
    chapter: 13,
    title: "O Amor",
    duration: "5:30",
    description: "Ainda que eu falasse as línguas dos homens e dos anjos...",
    audioUrl: "/audio/1corintios-13.mp3",
    coverUrl: "https://picsum.photos/seed/bible4/300/300"
  }
];

const BibleSection: React.FC = () => {
  const { play } = usePlayerStore();

  const handlePlayBible = (chapter: BibleChapter) => {
    const bibleTrack = {
      id: chapter.id.toString(),
      number: chapter.chapter,
      title: `${chapter.book} ${chapter.chapter} - ${chapter.title}`,
      artist: 'Bíblia Narrada',
      category: 'Bíblia',
      duration: chapter.duration,
      plays: 125000,
      isLiked: false,
      coverUrl: chapter.coverUrl,
      audioUrl: chapter.audioUrl,
      createdAt: new Date().toISOString()
    };
    play(bibleTrack);
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Bíblia Narrada
          </h2>
          <p className="text-gray-400">
            Ouça a palavra de Deus narrada com clareza e reverência
          </p>
        </div>
        <div className="hidden md:block">
          <button className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Ver todos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {bibleChapters.map((chapter) => (
          <div
            key={chapter.id}
            className="group bg-background-secondary rounded-lg overflow-hidden hover:bg-background-tertiary transition-all duration-300"
          >
            {/* Cover Image */}
            <div className="aspect-square relative overflow-hidden">
              <img 
                src={chapter.coverUrl}
                alt={`${chapter.book} ${chapter.chapter}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Play Button */}
              <button
                onClick={() => handlePlayBible(chapter)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-black p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                aria-label={`Reproduzir ${chapter.book} ${chapter.chapter}`}
              >
                <Play className="w-6 h-6 fill-current" />
              </button>

              {/* Duration Badge */}
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {chapter.duration}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Book className="w-4 h-4 text-primary-400" />
                <span className="text-primary-400 text-sm font-medium">
                  {chapter.book} {chapter.chapter}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                {chapter.title}
              </h3>
              
              <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                {chapter.description}
              </p>

              <button
                onClick={() => handlePlayBible(chapter)}
                className="w-full bg-background-tertiary hover:bg-primary-500/20 text-white hover:text-primary-400 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group/btn"
              >
                <Play className="w-4 h-4 group-hover/btn:fill-current" />
                Reproduzir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Ver todos button */}
      <div className="md:hidden mt-6 text-center">
        <button className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Ver todos os capítulos
        </button>
      </div>
    </section>
  );
};

export default BibleSection;
