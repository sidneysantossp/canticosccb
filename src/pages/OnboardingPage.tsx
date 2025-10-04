import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Music2, Check } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  const categories = [
    { id: 'louvor', name: 'Louvor', icon: '🙏' },
    { id: 'adoracao', name: 'Adoração', icon: '❤️' },
    { id: 'classicos', name: 'Clássicos', icon: '📖' },
    { id: 'instrumental', name: 'Instrumental', icon: '🎹' },
    { id: 'coral', name: 'Coral', icon: '🎤' },
    { id: 'oracao', name: 'Oração', icon: '🕊️' }
  ];

  const artists = [
    { id: '1', name: 'Coral CCB', image: 'https://picsum.photos/seed/coral/150/150' },
    { id: '2', name: 'Orquestra CCB', image: 'https://picsum.photos/seed/orquestra/150/150' },
    { id: '3', name: 'Hinos Clássicos', image: 'https://picsum.photos/seed/classicos/150/150' },
    { id: '4', name: 'Instrumentais', image: 'https://picsum.photos/seed/instrumental/150/150' },
    { id: '5', name: 'Jovens CCB', image: 'https://picsum.photos/seed/jovens/150/150' },
    { id: '6', name: 'Crianças CCB', image: 'https://picsum.photos/seed/criancas/150/150' }
  ];

  const steps = [
    {
      title: 'Bem-vindo ao Cânticos CCB',
      description: 'Vamos personalizar sua experiência',
      content: (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-primary-500 rounded-full mb-8">
            <Music2 className="w-16 h-16 text-black" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Bem-vindo!</h2>
          <p className="text-text-muted text-lg mb-8 max-w-md mx-auto">
            Estamos felizes em ter você aqui. Vamos configurar sua experiência musical em apenas alguns passos.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto text-center">
            <div className="p-4 bg-background-secondary rounded-lg">
              <div className="text-3xl mb-2">🎵</div>
              <p className="text-sm text-text-muted">Milhares de hinos</p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <div className="text-3xl mb-2">📱</div>
              <p className="text-sm text-text-muted">Ouça offline</p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <div className="text-3xl mb-2">❤️</div>
              <p className="text-sm text-text-muted">Suas playlists</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Escolha suas categorias favoritas',
      description: 'Selecione pelo menos 3 categorias',
      content: (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            O que você gosta de ouvir?
          </h2>
          <p className="text-text-muted text-center mb-8">
            Selecione suas categorias favoritas para receber recomendações personalizadas
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                    } else {
                      setSelectedCategories([...selectedCategories, category.id]);
                    }
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'bg-primary-500/20 border-primary-500'
                      : 'bg-background-secondary border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                  {isSelected && (
                    <div className="mt-2 inline-flex items-center justify-center w-6 h-6 bg-primary-500 rounded-full">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-center mt-6 text-sm text-text-muted">
              {selectedCategories.length} {selectedCategories.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
            </p>
          )}
        </div>
      )
    },
    {
      title: 'Escolha seus artistas favoritos',
      description: 'Selecione pelo menos 3 artistas',
      content: (
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Quem você quer ouvir?
          </h2>
          <p className="text-text-muted text-center mb-8">
            Escolha seus artistas favoritos para personalizar suas recomendações
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {artists.map((artist) => {
              const isSelected = selectedArtists.includes(artist.id);
              return (
                <button
                  key={artist.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedArtists(selectedArtists.filter(id => id !== artist.id));
                    } else {
                      setSelectedArtists([...selectedArtists, artist.id]);
                    }
                  }}
                  className={`relative group transition-all ${
                    isSelected ? 'transform scale-105' : ''
                  }`}
                >
                  <div className={`relative rounded-full overflow-hidden border-4 transition-all ${
                    isSelected ? 'border-primary-500' : 'border-transparent'
                  }`}>
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className={`absolute inset-0 bg-black transition-opacity ${
                      isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-30'
                    }`} />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-black" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-white font-medium mt-3 text-center">{artist.name}</p>
                </button>
              );
            })}
          </div>
          {selectedArtists.length > 0 && (
            <p className="text-center mt-6 text-sm text-text-muted">
              {selectedArtists.length} {selectedArtists.length === 1 ? 'artista selecionado' : 'artistas selecionados'}
            </p>
          )}
        </div>
      )
    },
    {
      title: 'Tudo pronto!',
      description: 'Comece a ouvir agora',
      content: (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-primary-500 rounded-full mb-8">
            <Check className="w-16 h-16 text-black" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Você está pronto!</h2>
          <p className="text-text-muted text-lg mb-8 max-w-md mx-auto">
            Sua experiência foi personalizada com base nas suas preferências. Agora é só começar a ouvir!
          </p>
          <div className="bg-background-secondary rounded-xl p-6 max-w-md mx-auto mb-8">
            <h3 className="text-white font-semibold mb-4">Suas preferências:</h3>
            <div className="space-y-3 text-left">
              <div>
                <p className="text-text-muted text-sm mb-2">Categorias favoritas:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    return (
                      <span key={catId} className="px-3 py-1 bg-primary-500/20 text-primary-500 rounded-full text-sm">
                        {cat?.icon} {cat?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-2">Artistas favoritos:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedArtists.map(artId => {
                    const art = artists.find(a => a.id === artId);
                    return (
                      <span key={artId} className="px-3 py-1 bg-background-tertiary text-white rounded-full text-sm">
                        {art?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const canProceed = () => {
    if (currentStep === 1) return selectedCategories.length >= 3;
    if (currentStep === 2) return selectedArtists.length >= 3;
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar onboarding
      navigate('/');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-tertiary flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-muted">
              Passo {currentStep + 1} de {steps.length}
            </span>
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="text-sm text-text-muted hover:text-white transition-colors"
              >
                Pular
              </button>
            )}
          </div>
          <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-background-secondary/50 backdrop-blur-sm rounded-2xl p-8 mb-6">
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white hover:bg-background-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-8 py-3 bg-primary-500 text-black font-semibold rounded-full hover:bg-primary-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
