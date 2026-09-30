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
import { SlidersHorizontal, Eye, Loader2, Clock, AlertTriangle, X, Save } from 'lucide-react';

interface AuthUserData {
  id: number;
  email: string;
  name?: string;
}

export default function CatalogStudioPage() {
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [catalog, setCatalog] = useState<Catalog>(INITIAL_CATALOG);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastModifiedTime, setLastModifiedTime] = useState<number | null>(null);
  const [showInactivitySaveAlert, setShowInactivitySaveAlert] = useState<boolean>(false);

  const [saveMessage, setSaveMessage] = useState<string>('Guardado en MySQL');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Verify authentication and load catalog on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const requestedSlug = urlParams.get('catalog');

    async function verifyAuthAndLoad() {
      // 1. Check if user is logged in
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
          return;
        }

        const authData = await authRes.json();
        if (!authData?.authenticated || !authData?.user) {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
          return;
        }

        setCurrentUser(authData.user);
        setIsAuthChecking(false);
      } catch (err) {
        console.error('Error verifying auth:', err);
        window.location.href = '/login';
        return;
      }

      // 2. If a specific slug is requested in URL, fetch it from MySQL
      if (requestedSlug) {
        try {
          const res = await fetch(`/api/catalogs/${requestedSlug}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              setCatalog(data);
              saveCatalogToStorage(data);
              setHasUnsavedChanges(false);
              setLastModifiedTime(null);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching requested catalog from DB:', err);
        }
      }

      // 3. Otherwise, fetch the user's most recent active catalog from MySQL
      try {
        const res = await fetch('/api/catalog?slug=current');
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setCatalog(data);
            saveCatalogToStorage(data);
            setHasUnsavedChanges(false);
            setLastModifiedTime(null);
            const newUrl = `${window.location.pathname}?catalog=${data.slug}`;
            window.history.replaceState(null, '', newUrl);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching current catalog from DB:', err);
      }

      // 4. Fallback to localStorage or INITIAL_CATALOG
      const stored = getCatalogFromStorage();
      if (stored) {
        setCatalog(stored);
        setHasUnsavedChanges(false);
        setLastModifiedTime(null);
      }
    }

    verifyAuthAndLoad();
  }, []);

  // Alert before closing tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Standards-compliant browsers show generic prompt; setting returnValue triggers it
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Check if user has unsaved changes for more than 10 minutes (600,000 ms)
  useEffect(() => {
    if (!hasUnsavedChanges || !lastModifiedTime) {
      setShowInactivitySaveAlert(false);
      return;
    }

    const checkInactivity = () => {
      const elapsed = Date.now() - lastModifiedTime;
      if (elapsed >= 10 * 60 * 1000) {
        setShowInactivitySaveAlert(true);
      }
    };

    checkInactivity();
    const interval = setInterval(checkInactivity, 15000);
    return () => clearInterval(interval);
  }, [hasUnsavedChanges, lastModifiedTime]);

  const handleCatalogChange = (updated: Catalog) => {
    setCatalog(updated);
    setIsSaved(false);
    setHasUnsavedChanges(true);
    setLastModifiedTime((prev) => prev ?? Date.now());
  };

  const handleLogout = async () => {
    if (hasUnsavedChanges) {
      if (!confirm('Tienes cambios sin guardar. ¿Seguro que deseas cerrar sesión y perderlos?')) {
        return;
      }
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error logging out:', err);
    }
    window.location.href = '/login';
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
        setHasUnsavedChanges(false);
        setLastModifiedTime(null);
        setShowInactivitySaveAlert(false);

        if (data.catalog?.slug && data.catalog.slug !== catalog.slug) {
          setCatalog(data.catalog);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (res.status === 403) {
          alert(errData.error || 'No tienes permiso para editar este catálogo. Solo el dueño puede modificarlo.');
          setSaveMessage('Sin permisos de edición');
          return;
        }
        setSaveMessage(errData.error || 'Guardado solo local');
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
    if (hasUnsavedChanges) {
      if (
        !confirm(
          'Tienes cambios sin guardar en el catálogo actual. ¿Seguro que deseas cambiar de catálogo y perder los cambios no guardados?'
        )
      ) {
        return;
      }
    }
    setCatalog(selected);
    saveCatalogToStorage(selected);
    setHasUnsavedChanges(false);
    setLastModifiedTime(null);
    setShowInactivitySaveAlert(false);

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
    setHasUnsavedChanges(false);
    setLastModifiedTime(null);
    setShowInactivitySaveAlert(false);

    fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imported),
    }).catch(() => {});

    setSaveMessage('Catálogo restaurado en BD');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-stone-100">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center p-2.5 mb-4 shadow-sm">
          <img
            src="/gaos-candles.svg"
            alt="GAOS CANDLES"
            className="w-full h-full object-contain invert brightness-0 invert"
          />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
        <p className="text-xs text-stone-400 font-mono tracking-wide">
          Verificando sesión en GAOS CANDLES...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top App Header */}
      <HeaderNavbar
        catalog={catalog}
        user={currentUser}
        onLogout={handleLogout}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenCatalogManager={() => setIsCatalogManagerOpen(true)}
        onSave={handleSave}
        isSaved={isSaved}
        hasUnsavedChanges={hasUnsavedChanges}
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
          <CatalogPreview catalog={catalog} onChange={handleCatalogChange} />
        </main>
      </div>

      {/* 10-Minute Inactivity Save Reminder Alert */}
      {showInactivitySaveAlert && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-stone-900 text-stone-100 p-4 rounded-2xl shadow-2xl border-2 border-amber-500/80 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Llevas más de 10 minutos sin guardar</span>
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Tienes modificaciones en tu catálogo que aún no se han sincronizado con la base de datos. Guarda tu trabajo para evitar pérdidas accidentales.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSave();
                    setShowInactivitySaveAlert(false);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Ahora</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInactivitySaveAlert(false);
                    // Remind again in 5 minutes
                    setLastModifiedTime(Date.now() - 5 * 60 * 1000);
                  }}
                  className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Recordarme en 5 min
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInactivitySaveAlert(false)}
              className="p-1 text-stone-400 hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
