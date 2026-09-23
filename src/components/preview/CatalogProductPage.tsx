import React from 'react';
import { Catalog, Product } from '../../types/catalog';
import { VisualDimensionIndicator } from './VisualDimensionIndicator';
import { FragranceBadgeList } from './FragranceBadgeList';
import { ColorSwatchList } from './ColorSwatchList';
import { MessageCircle, Clock, Sparkles } from 'lucide-react';

interface CatalogProductPageProps {
  catalog: Catalog;
  products: Product[];
  pageNumber: number;
  totalPages: number;
  sectionTitle?: string;
  isPrintMode?: boolean;
}

export const CatalogProductPage: React.FC<CatalogProductPageProps> = ({
  catalog,
  products,
  pageNumber,
  totalPages,
  sectionTitle = 'Colección de Temporada',
  isPrintMode = false,
}) => {
  const { theme, contact } = catalog;
  const { palette } = theme;

  const handleWhatsAppOrder = (product: Product) => {
    if (!contact.whatsapp) return;
    const phone = contact.whatsapp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola! Vi su catálogo "${catalog.title}" y me interesa ordenar la vela: *${product.name}* (Precio: ${catalog.theme.currencySymbol}${product.price.toLocaleString()}). ¿Tienen disponibilidad?`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div
      className={`catalog-page relative w-full aspect-[1/1.414] mx-auto p-8 md:p-12 flex flex-col justify-between overflow-hidden ${
        isPrintMode ? 'shadow-none rounded-none' : 'shadow-xl rounded-sm'
      } print:shadow-none print:m-0 print:rounded-none`}
      style={{
        backgroundColor: palette.background,
        color: palette.textPrimary,
      }}
    >
      {/* Page Header */}
      <div className="relative z-10 pb-4 border-b flex items-center justify-between"
        style={{ borderColor: palette.border }}
      >
        <div>
          <span
            className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase block"
            style={{ color: palette.secondary }}
          >
            {catalog.brandName} · {catalog.seasonTag}
          </span>
          <h2
            className="font-serif text-xl md:text-2xl font-normal uppercase tracking-wide mt-0.5"
            style={{ color: palette.primary }}
          >
            {sectionTitle}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono opacity-60">
            Pág. {pageNumber} / {totalPages}
          </span>
        </div>
      </div>

      {/* Products Grid (2 products per editorial A4 page for high luxury presentation) */}
      <div className={`relative z-10 my-auto py-2 grid ${isPrintMode ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} print:grid-cols-2 gap-6 md:gap-8 flex-1 items-start`}>
        {products.map((product) => (
          <div
            key={product.id}
            className={`group flex flex-col h-full bg-white/60 ${isPrintMode ? '' : 'backdrop-blur-xs'} rounded-md border p-4 md:p-5 shadow-2xs hover:shadow-md transition-all`}
            style={{
              borderColor: palette.border,
              backgroundColor: palette.cardBackground,
            }}
          >
            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-stone-100 mb-3.5 border"
              style={{ borderColor: palette.border }}
            >
              <img
                src={product.image || 'https://images.unsplash.com/photo-1570823635306-250abb06d4b3?auto=format&fit=crop&w=600&q=80'}
                alt={product.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />

              {product.isSeasonalSpecial && (
                <span
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs"
                  style={{
                    backgroundColor: palette.primary,
                    color: '#FFFFFF',
                  }}
                >
                  Edición Especial
                </span>
              )}
            </div>

            {/* Title & SKU & Price */}
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className="font-serif text-lg md:text-xl font-medium leading-tight"
                  style={{ color: palette.primary }}
                >
                  {product.name}
                </h3>
                <span
                  className="font-serif text-base md:text-lg font-bold whitespace-nowrap"
                  style={{ color: palette.accent || palette.primary }}
                >
                  {catalog.theme.currencySymbol}
                  {product.price.toLocaleString()}
                </span>
              </div>

              {product.sku && (
                <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                  Ref: {product.sku}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p
              className="text-xs leading-relaxed opacity-85 mb-3 line-clamp-3"
              style={{ color: palette.textSecondary }}
            >
              {product.description}
            </p>

            {/* Visual Dimension Indicator (Alto ↕ y Ancho ↔) */}
            {theme.showDimensionsVisual && (
              <div className="mb-3">
                <VisualDimensionIndicator
                  heightCm={product.heightCm}
                  widthCm={product.widthCm}
                  color={palette.primary}
                  textColor={palette.textPrimary}
                />
              </div>
            )}

            {/* Fragrances Badges */}
            {theme.showFragrances && product.fragrances && product.fragrances.length > 0 && (
              <div className="mb-2.5">
                <FragranceBadgeList
                  fragrances={product.fragrances}
                  color={palette.primary}
                />
              </div>
            )}

            {/* Available Colors Swatches */}
            {theme.showColorSwatches && product.colors && product.colors.length > 0 && (
              <div className="mb-3">
                <ColorSwatchList colors={product.colors} />
              </div>
            )}

            {/* Extra Specs: Burn Time / Wax Type */}
            {(product.burnTimeHours || product.waxType) && (
              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t mt-auto"
                style={{ borderColor: `${palette.border}80` }}
              >
                {product.burnTimeHours && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{product.burnTimeHours}h duración
                  </span>
                )}
                {product.waxType && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {product.waxType}
                  </span>
                )}
              </div>
            )}

            {/* Interactive WhatsApp Order Button (Omitted in PDF print) */}
            {!isPrintMode && contact.whatsapp && (
              <button
                type="button"
                onClick={() => handleWhatsAppOrder(product)}
                className="mt-3 w-full py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:opacity-90 active:scale-98 print:hidden"
                style={{
                  backgroundColor: palette.primary,
                  color: '#FFFFFF',
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Pedir esta vela por WhatsApp</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Page Footer */}
      <div
        className="relative z-10 pt-3 border-t flex justify-between items-center text-[10px] md:text-xs tracking-wider uppercase opacity-70"
        style={{ borderColor: palette.border }}
      >
        <span>{catalog.brandName}</span>
        <span>{contact.whatsapp || contact.instagram}</span>
        <span>Página {pageNumber}</span>
      </div>
    </div>
  );
};
