import React from 'react';
import { Catalog } from '../../types/catalog';
import { MessageCircle, AtSign, MapPin, HeartHandshake, Sparkles } from 'lucide-react';

interface CatalogBackCoverPageProps {
  catalog: Catalog;
  pageNumber: number;
  isPrintMode?: boolean;
}

export const CatalogBackCoverPage: React.FC<CatalogBackCoverPageProps> = ({
  catalog,
  pageNumber,
  isPrintMode = false,
}) => {
  const { theme, contact } = catalog;
  const { palette } = theme;

  const phoneOnly = contact.whatsapp?.replace(/[^0-9]/g, '') || '';

  return (
    <div
      className={`catalog-page relative w-full min-h-0 md:aspect-[1/1.414] mx-auto p-6 sm:p-8 md:p-16 flex flex-col justify-between overflow-visible md:overflow-hidden ${
        isPrintMode ? 'shadow-none rounded-none aspect-[1/1.414] overflow-hidden' : 'shadow-xl rounded-sm'
      } print:shadow-none print:m-0 print:rounded-none print:aspect-[1/1.414] print:overflow-hidden`}
      style={{
        backgroundColor: palette.background,
        color: palette.textPrimary,
      }}
    >
      {/* Decorative frame */}
      <div
        className="absolute inset-4 sm:inset-6 pointer-events-none border opacity-30"
        style={{ borderColor: palette.primary }}
      />

      {/* Top Header */}
      <div className="relative z-10 text-center pt-2 sm:pt-4">
        <span
          className="text-xs font-semibold tracking-[0.25em] uppercase block mb-1"
          style={{ color: palette.secondary }}
        >
          {catalog.brandName}
        </span>
        <h2
          className="font-serif text-xl sm:text-2xl md:text-4xl font-normal uppercase tracking-wide"
          style={{ color: palette.primary }}
        >
          ¿CÓMO REALIZAR TU PEDIDO?
        </h2>
        <div
          className="w-14 sm:w-16 h-[1px] mx-auto my-2 sm:my-3"
          style={{ backgroundColor: palette.secondary }}
        />
      </div>

      {/* Center Cards: How to order, Care Tips, & Contact */}
      <div className="relative z-10 max-w-lg mx-auto w-full flex flex-col gap-4 sm:gap-6 my-auto py-2 sm:py-4">
        {/* Step-by-step box */}
        <div
          className="p-4 sm:p-5 rounded-md border bg-white/70 backdrop-blur-xs shadow-2xs"
          style={{ borderColor: palette.border }}
        >
          <h3
            className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center gap-2"
            style={{ color: palette.primary }}
          >
            <Sparkles className="w-4 h-4" /> Pasos para Ordenar
          </h3>
          <ol className="space-y-2 sm:space-y-2.5 text-xs leading-relaxed" style={{ color: palette.textSecondary }}>
            <li className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: palette.primary }}
              >
                1
              </span>
              <span>Elige tus velas favoritas y verifica las medidas y aromas disponibles.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: palette.primary }}
              >
                2
              </span>
              <span>Escríbenos por WhatsApp con los nombres de referencia y cantidad deseada.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: palette.primary }}
              >
                3
              </span>
              <span>Confirmamos tu pedido, método de pago y fecha estimada de entrega o envío.</span>
            </li>
          </ol>
        </div>

        {/* Contact Links */}
        <div
          className="p-4 sm:p-5 rounded-md border bg-white/70 backdrop-blur-xs shadow-2xs flex flex-col gap-3"
          style={{ borderColor: palette.border }}
        >
          <h3
            className="font-serif text-sm sm:text-base font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-2"
            style={{ color: palette.primary }}
          >
            <HeartHandshake className="w-4 h-4" /> Canales de Atención Directa
          </h3>

          {contact.whatsapp && (
            <a
              href={`https://wa.me/${phoneOnly}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-sm transition-all hover:bg-black/5"
              style={{ color: palette.textPrimary }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">WhatsApp Pedidos</span>
                <span className="font-semibold text-xs sm:text-sm">{contact.whatsapp}</span>
              </div>
            </a>
          )}

          {contact.instagram && (
            <div className="flex items-center gap-3 p-2 rounded-sm" style={{ color: palette.textPrimary }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: '#E1306C' }}
              >
                <AtSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Instagram</span>
                <span className="font-semibold text-xs sm:text-sm">{contact.instagram}</span>
              </div>
            </div>
          )}

          {contact.location && (
            <div className="flex items-center gap-3 px-2 text-xs opacity-80" style={{ color: palette.textSecondary }}>
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: palette.secondary }} />
              <span>{contact.location}</span>
            </div>
          )}
        </div>

        {contact.deliveryNotes && (
          <p className="text-center text-[11px] leading-relaxed italic opacity-80 max-w-sm mx-auto" style={{ color: palette.textSecondary }}>
            * {contact.deliveryNotes}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="relative z-10 pt-3 sm:pt-4 border-t text-center text-[10px] md:text-xs tracking-wider uppercase opacity-70"
        style={{ borderColor: palette.border }}
      >
        <p>© {catalog.editionYear} {catalog.brandName} · Hecho con amor artesanal</p>
        <p className="mt-1">Página {pageNumber}</p>
      </div>
    </div>
  );
};
