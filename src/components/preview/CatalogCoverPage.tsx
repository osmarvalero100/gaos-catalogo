import React from 'react';
import { Catalog } from '../../types/catalog';
import { Flame } from 'lucide-react';

interface CatalogCoverPageProps {
  catalog: Catalog;
  isPrintMode?: boolean;
}

export const CatalogCoverPage: React.FC<CatalogCoverPageProps> = ({
  catalog,
  isPrintMode = false,
}) => {
  const { theme, contact } = catalog;
  const { palette } = theme;

  return (
    <div
      className={`catalog-page relative w-full aspect-[1/1.414] mx-auto p-12 md:p-16 flex flex-col justify-between overflow-hidden ${
        isPrintMode ? 'shadow-none rounded-none' : 'shadow-xl rounded-sm'
      } print:shadow-none print:m-0 print:rounded-none`}
      style={{
        backgroundColor: palette.background,
        color: palette.textPrimary,
      }}
    >
      {/* Subtle Frame / Border Accents */}
      <div
        className="absolute inset-5 pointer-events-none border opacity-40 print:inset-4"
        style={{ borderColor: palette.primary }}
      />
      <div
        className="absolute inset-7 pointer-events-none border opacity-15 print:inset-6"
        style={{ borderColor: palette.secondary }}
      />

      {/* Top Header / Brand Logo & Season Badge */}
      <div className="relative z-10 flex flex-col items-center text-center pt-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-xs"
          style={{
            backgroundColor: `${palette.primary}15`,
            color: palette.primary,
          }}
        >
          {catalog.brandLogo ? (
            <img
              src={catalog.brandLogo}
              alt={catalog.brandName}
              crossOrigin="anonymous"
              className="w-8 h-8 object-contain"
            />
          ) : (
            <Flame className="w-6 h-6" />
          )}
        </div>

        <p
          className="text-xs md:text-sm font-semibold tracking-[0.25em] uppercase"
          style={{ color: palette.primary }}
        >
          {catalog.brandName || 'COLECCIÓN ARTESANAL'} · {catalog.editionYear || '2026'}
        </p>

        {catalog.seasonTag && (
          <span
            className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] uppercase tracking-widest font-medium"
            style={{
              backgroundColor: `${palette.secondary}20`,
              color: palette.primary,
              border: `1px solid ${palette.secondary}35`,
            }}
          >
            {catalog.seasonTag}
          </span>
        )}
      </div>

      {/* Hero Featured Photography */}
      <div className="relative z-10 my-4 flex-1 flex flex-col items-center justify-center max-h-[50%]">
        <div
          className="w-full h-full max-h-[380px] overflow-hidden rounded-sm shadow-md border"
          style={{ borderColor: `${palette.border}` }}
        >
          <img
            src={catalog.coverImage}
            alt={catalog.title}
            crossOrigin="anonymous"
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>

      {/* Title & Editorial Description */}
      <div className="relative z-10 text-center flex flex-col items-center max-w-xl mx-auto pb-4">
        <h1
          className="font-serif text-3xl md:text-5xl font-normal tracking-wide uppercase leading-tight mb-3"
          style={{ color: palette.primary }}
        >
          {catalog.title}
        </h1>

        <p
          className="font-serif italic text-base md:text-lg opacity-85 mb-4"
          style={{ color: palette.textSecondary }}
        >
          {catalog.subtitle}
        </p>

        <div
          className="w-24 h-[1px] my-3"
          style={{ backgroundColor: palette.secondary }}
        />

        <p
          className="text-xs md:text-sm leading-relaxed max-w-md opacity-80"
          style={{ color: palette.textSecondary }}
        >
          {catalog.introText}
        </p>
      </div>

      {/* Bottom Footer Details */}
      <div className="relative z-10 pt-4 border-t flex justify-between items-center text-[10px] md:text-xs tracking-wider uppercase opacity-70"
        style={{ borderColor: `${palette.border}` }}
      >
        <span>{contact.instagram || '@tumarca'}</span>
        <span>{contact.whatsapp || 'WhatsApp'}</span>
        <span>Página 1</span>
      </div>
    </div>
  );
};
