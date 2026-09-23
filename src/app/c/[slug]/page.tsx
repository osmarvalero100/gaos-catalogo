'use client';

import React, { useEffect, useState } from 'react';
import { Catalog, Product } from '../../../types/catalog';
import { INITIAL_CATALOG } from '../../../data/defaultCatalog';
import { decodeCatalogFromShareUrl, getCatalogFromStorage } from '../../../lib/storage';
import { CatalogPreview } from '../../../components/preview/CatalogPreview';
import { VisualDimensionIndicator } from '../../../components/preview/VisualDimensionIndicator';
import { FragranceBadgeList } from '../../../components/preview/FragranceBadgeList';
import { ColorSwatchList } from '../../../components/preview/ColorSwatchList';
import { PdfExportModal } from '../../../components/shared/PdfExportModal';
import { MessageCircle, FileDown, Search, Grid, BookOpen, Clock, Sparkles } from 'lucide-react';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CustomerCatalogView() {
  const params = useParams();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  const [catalog, setCatalog] = useState<Catalog>(INITIAL_CATALOG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewStyle, setViewStyle] = useState<'pages' | 'cards'>('pages');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalogData() {
      // 1. Check if payload exists in hash (e.g. preview from unsaved draft)
      if (typeof window !== 'undefined' && window.location.hash) {
        const decoded = decodeCatalogFromShareUrl(window.location.hash);
        if (decoded && isMounted) {
          setCatalog(decoded);
          setIsLoading(false);
          return;
        }
      }

      // 2. Query persistent MySQL database by slug
      if (slug) {
        try {
          const res = await fetch(`/api/catalogs/${slug}`);
          if (res.ok) {
            const data = await res.json();
            if (data && isMounted) {
              setCatalog(data);
              setIsLoading(false);
              return;
            }
          } else if (res.status === 404) {
            // Check localStorage before declaring error
            const stored = getCatalogFromStorage(slug);
            if (stored && isMounted) {
              setCatalog(stored);
              setIsLoading(false);
              return;
            }
            if (isMounted) {
              setLoadError('El catálogo solicitado no existe o fue despublicado.');
              setIsLoading(false);
            }
            return;
          }
        } catch (err) {
          console.error('Error fetching catalog from DB:', err);
        }
      }

      // 3. Fallback to localStorage
      const stored = getCatalogFromStorage(slug);
      if (stored && isMounted) {
        setCatalog(stored);
      }
      if (isMounted) setIsLoading(false);
    }

    fetchCatalogData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleOrderWhatsApp = (product: Product) => {
    if (!catalog.contact.whatsapp) return;
    const phone = catalog.contact.whatsapp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola! Vi el catálogo "${catalog.title}" y deseo ordenar la vela: *${product.name}* (${catalog.theme.currencySymbol}${product.price.toLocaleString()}). ¿Podrían darme más información?`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const filteredProducts = catalog.products.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.fragrances.some((f) => f.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-700">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-700 mb-4" />
        <p className="text-sm font-medium tracking-wide">Cargando catálogo...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-800 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-stone-500" />
        </div>
        <h2 className="text-xl font-serif font-bold mb-2">Catálogo no disponible</h2>
        <p className="text-stone-600 text-sm max-w-md mb-6">{loadError}</p>
        <a
          href="/"
          className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 transition-colors"
        >
          Volver al Estudio
        </a>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{
        backgroundColor: catalog.theme.palette.background,
        color: catalog.theme.palette.textPrimary,
      }}
    >
      {/* Top Customer Navigation Bar (Hidden in Print) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span
              className="text-[10px] uppercase tracking-widest font-bold block"
              style={{ color: catalog.theme.palette.primary }}
            >
              {catalog.brandName} · {catalog.editionYear}
            </span>
            <h1 className="text-sm sm:text-base font-serif font-bold tracking-wide">
              {catalog.title}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* View Style Switcher */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setViewStyle('pages')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                  viewStyle === 'pages'
                    ? 'bg-white font-semibold text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Páginas Revista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewStyle('cards')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                  viewStyle === 'cards'
                    ? 'bg-white font-semibold text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
            </div>

            {/* PDF Export Button */}
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>

            {/* Contact WhatsApp */}
            {catalog.contact.whatsapp && (
              <a
                href={`https://wa.me/${catalog.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {viewStyle === 'pages' ? (
        <main className="flex-1 py-6 flex justify-center print:p-0 print:m-0 print:block">
          <CatalogPreview catalog={catalog} />
        </main>
      ) : (
        /* Mobile-Friendly Cards View */
        <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span
              className="text-xs uppercase tracking-widest font-bold block mb-1"
              style={{ color: catalog.theme.palette.secondary }}
            >
              {catalog.seasonTag}
            </span>
            <h2
              className="font-serif text-3xl sm:text-4xl font-normal uppercase tracking-wide mb-3"
              style={{ color: catalog.theme.palette.primary }}
            >
              {catalog.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
              {catalog.introText}
            </p>

            {/* Scent & Candle Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por vela o aroma (ej. Vainilla, Pino...)"
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-full shadow-2xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((candle) => (
              <div
                key={candle.id}
                className="group flex flex-col bg-white rounded-xl border border-stone-200 p-4 shadow-2xs hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-100 mb-3 border border-stone-100">
                  <img
                    src={candle.image}
                    alt={candle.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  {candle.isSeasonalSpecial && (
                    <span
                      className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
                      style={{ backgroundColor: catalog.theme.palette.primary }}
                    >
                      Edición Especial
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className="font-serif text-base font-semibold leading-tight"
                      style={{ color: catalog.theme.palette.primary }}
                    >
                      {candle.name}
                    </h3>
                    <span
                      className="font-serif text-base font-bold"
                      style={{ color: catalog.theme.palette.accent }}
                    >
                      {catalog.theme.currencySymbol}
                      {candle.price.toLocaleString()}
                    </span>
                  </div>
                  {candle.sku && (
                    <span className="text-[10px] font-mono uppercase text-stone-400">
                      Ref: {candle.sku}
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mb-3 line-clamp-3">
                  {candle.description}
                </p>

                {/* Visual Dimension Indicator */}
                <div className="mb-3">
                  <VisualDimensionIndicator
                    heightCm={candle.heightCm}
                    widthCm={candle.widthCm}
                    color={catalog.theme.palette.primary}
                  />
                </div>

                {/* Fragrances */}
                {candle.fragrances && candle.fragrances.length > 0 && (
                  <div className="mb-2.5">
                    <FragranceBadgeList
                      fragrances={candle.fragrances}
                      color={catalog.theme.palette.primary}
                    />
                  </div>
                )}

                {/* Colors */}
                {candle.colors && candle.colors.length > 0 && (
                  <div className="mb-3">
                    <ColorSwatchList colors={candle.colors} />
                  </div>
                )}

                {/* Burn time */}
                {candle.burnTimeHours && (
                  <div className="text-[11px] text-stone-500 flex items-center gap-1 mb-4 pt-1 border-t border-stone-100">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{candle.burnTimeHours} horas de duración</span>
                  </div>
                )}

                {/* Order via WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleOrderWhatsApp(candle)}
                  className="mt-auto w-full py-2 px-3 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-90 active:scale-98 transition-all"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir por WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* PDF Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        catalogTitle={catalog.title}
      />
    </div>
  );
}
