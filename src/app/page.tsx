'use client';

import React, { useState, useEffect } from 'react';
import { Catalog } from '../types/catalog';
import { INITIAL_CATALOG } from '../data/defaultCatalog';
import { saveCatalogToStorage, getCatalogFromStorage } from '../lib/storage';
import { HeaderNavbar } from '../components/shared/HeaderNavbar';
import { CatalogEditor } from '../components/editor/CatalogEditor';
import { CatalogPreview } from '../components/preview/CatalogPreview';
import { PdfExportModal } from '../components/shared/PdfExportModal';
import { ShareUrlModal } from '../components/shared/ShareUrlModal';
import { CatalogManagerModal } from '../components/shared/CatalogManagerModal';
import { SlidersHorizontal, Eye } from 'lucide-react';

export default function CatalogStudioPage() {
  const [catalog, setCatalog] = useState<Catalog>(INITIAL_CATALOG);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('Guardado en MySQL');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Load catalog on mount: check URL query param or fallback to current MySQL catalog / localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const requestedSlug = urlParams.get('catalog');

    async function loadInitialCatalog() {
      // 1. If a specific slug is requested in URL, fetch it from MySQL
      if (requestedSlug) {
        try {
          const res = await fetch(`/api/catalogs/${requestedSlug}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              setCatalog(data);
              saveCatalogToStorage(data);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching requested catalog from DB:', err);
        }
      }

      // 2. Otherwise, fetch the most recent active catalog from MySQL
      try {
        const res = await fetch('/api/catalog?slug=current');
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setCatalog(data);
            saveCatalogToStorage(data);
            // Update URL without reload
            const newUrl = `${window.location.pathname}?catalog=${data.slug}`;
            window.history.replaceState(null, '', newUrl);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching current catalog from DB:', err);
      }

      // 3. Fallback to localStorage or INITIAL_CATALOG
      const stored = getCatalogFromStorage();
      if (stored) {
        setCatalog(stored);
      }
    }

    loadInitialCatalog();
  }, []);

  const handleCatalogChange = (updated: Catalog) => {
    setCatalog(updated);
    setIsSaved(false);
  };

  const handleSave = async () => {
    // 1. Save to local storage for quick cache
    saveCatalogToStorage(catalog);

    // 2. Persist to MySQL database (gaos_catalogo)
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalog),
      });

      if (res.ok) {
        const data = await res.json();
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSaveMessage(`Guardado en MySQL (${timeStr})`);
        if (data.catalog?.slug && data.catalog.slug !== catalog.slug) {
          setCatalog(data.catalog);
        }
      } else {
        setSaveMessage('Guardado solo local');
      }
    } catch {
      setSaveMessage('Guardado en navegador');
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3500);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catalog]);

  const handleSelectCatalog = (selected: Catalog) => {
    setCatalog(selected);
    saveCatalogToStorage(selected);
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?catalog=${selected.slug}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(catalog, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-${catalog.slug || 'velas'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (imported: Catalog) => {
    setCatalog(imported);
    saveCatalogToStorage(imported);
    fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imported),
    }).catch(() => {});

    setSaveMessage('Catálogo restaurado en BD');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top App Header */}
      <HeaderNavbar
        catalog={catalog}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenCatalogManager={() => setIsCatalogManagerOpen(true)}
        onSave={handleSave}
        isSaved={isSaved}
        saveMessage={saveMessage}
        onDownloadJson={handleDownloadJson}
        onImportJson={handleImportJson}
      />

      {/* Mobile Switcher Tab (Hidden on LG screens and in Print) */}
      <div className="lg:hidden flex border-b border-stone-200 bg-white print:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            mobileTab === 'editor'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
              : 'border-transparent text-stone-500'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Panel de Edición</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            mobileTab === 'preview'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/40'
              : 'border-transparent text-stone-500'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Vista Previa Revista</span>
        </button>
      </div>

      {/* Workspace Split Layout: Editor on Left, Live Preview on Right */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible">
        {/* Left: Customizer & Products Manager (Hidden in Print) */}
        <aside
          className={`w-full lg:w-[480px] xl:w-[520px] h-full flex flex-col flex-shrink-0 z-10 print:hidden ${
            mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <CatalogEditor
            catalog={catalog}
            onChange={handleCatalogChange}
          />
        </aside>

        {/* Right: Live A4 Editorial Magazine Preview */}
        <main
          className={`flex-1 h-full overflow-y-auto bg-stone-200/50 print:flex print:w-full print:h-auto print:overflow-visible print:bg-white ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <CatalogPreview catalog={catalog} />
        </main>
      </div>

      {/* Export to PDF Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        catalogTitle={catalog.title}
      />

      {/* Share URL Modal */}
      <ShareUrlModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        catalog={catalog}
      />

      {/* Multi-Catalog Manager Modal */}
      <CatalogManagerModal
        isOpen={isCatalogManagerOpen}
        onClose={() => setIsCatalogManagerOpen(false)}
        currentCatalogId={catalog.id || catalog.slug}
        onSelectCatalog={handleSelectCatalog}
      />
    </div>
  );
}
