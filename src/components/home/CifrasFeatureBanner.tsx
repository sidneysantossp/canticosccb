import React from 'react';

const CifrasFeatureBanner: React.FC = () => {
  return (
    <section className="px-0 sm:px-6">
      <a
        href="/cifras"
        aria-label="Conheça a nova experiência de Cifras CCB"
        className="group block overflow-hidden bg-background-secondary shadow-2xl shadow-black/30 transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-background-primary sm:rounded-[2rem] sm:border sm:border-primary-500/15"
      >
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet="/images/banners/cifras-ccb-mobile.png"
          />
          <img
            src="/images/banners/cifras-ccb-desktop.png"
            alt="Nova experiência de Cifras CCB com transposição, rolagem, acordes e ajustes rápidos"
            loading="eager"
            width={2048}
            height={1264}
            className="block aspect-[16/6] min-h-[180px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          />
        </picture>
      </a>
    </section>
  );
};

export default CifrasFeatureBanner;
