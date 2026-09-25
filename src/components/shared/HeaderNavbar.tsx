import React, { useRef } from 'react';
import { Catalog } from '../../types/catalog';
import {
  FileDown,
  Share2,
  ExternalLink,
  Save,
  Flame,
  Download,
  Upload,
  Check,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';

interface HeaderNavbarProps {
  catalog: Catalog;
  onOpenPdfModal: () => void;
  onOpenShareModal: () => void;
  onSave: () => void;
  onOpenCatalogManager: () => void;
  isSaved?: boolean;
  saveMessage?: string;
  onDownloadJson?: () => void;
  onImportJson?: (catalog: Catalog) => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  catalog,
  onOpenPdfModal,
  onOpenShareModal,
  onSave,
  onOpenCatalogManager,
  isSaved = false,
  saveMessage,
  onDownloadJson,
  onImportJson,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && (parsed.products || parsed.title)) {
          onImportJson?.(parsed);
        } else {
          alert('El archivo seleccionado no tiene el formato de catálogo válido.');
        }
      } catch {
        alert('Error al leer el archivo JSON. Verifica que sea un archivo válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-xs overflow-hidden border border-stone-700">
            {catalog.brandLogo || '/gaos-candles.svg' ? (
              <img
                src={catalog.brandLogo || '/gaos-candles.svg'}
                alt={catalog.brandName || 'GAOS CANDLES'}
                className="w-full h-full object-contain"
              />
            ) : (
              <Flame className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-stone-200">
                GAOS CANDLES
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                v2.0 DB
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Generador de Catálogos & PDF Persistente
            </p>
          </div>

          {/* Catalog Switcher Button */}
          <button
            type="button"
            onClick={onOpenCatalogManager}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs transition-colors shadow-2xs"
            title="Abrir gestor de catálogos en MySQL"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-stone-400 uppercase tracking-wider leading-tight">
                Mis Catálogos
              </span>
              <span className="font-semibold text-stone-100 max-w-[130px] sm:max-w-[180px] md:max-w-[220px] truncate leading-tight">
                {catalog.title || 'Catálogo'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5 shrink-0" />
          </button>
        </div>

        {/* Database Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] text-emerald-300 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>MySQL 8.0 Conectado · gaos_catalogo</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save Status / Button (Saves to MySQL & LocalStorage) */}
          <button
            type="button"
            onClick={onSave}
            title="Guarda los datos en la base de datos MySQL (85.31.63.21) y en el navegador"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 shadow-xs'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs'
            }`}
          >
            {isSaved ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-white" />
            )}
            <span>{isSaved ? saveMessage || 'Guardado en MySQL' : 'Guardar en BD'}</span>
          </button>

          {/* Backup Options: Download JSON / Import JSON */}
          {onDownloadJson && (
            <button
              type="button"
              onClick={onDownloadJson}
              title="Descargar archivo .JSON de respaldo a tu computadora"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 border border-stone-700/80 flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden xl:inline">Backup</span>
            </button>
          )}

          {onImportJson && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Cargar y restaurar un catálogo desde un archivo .JSON de respaldo"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 border border-stone-700/80 flex items-center gap-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-stone-400" />
                <span className="hidden xl:inline">Restaurar</span>
              </button>
            </>
          )}

          {/* View as customer */}
          <a
            href={`/c/${catalog.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white flex items-center gap-1.5 border border-stone-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Vista Cliente</span>
          </a>

          {/* Share URL */}
          <button
            type="button"
            onClick={onOpenShareModal}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compartir</span>
          </button>

          {/* Generate PDF */}
          <button
            type="button"
            onClick={onOpenPdfModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Generar PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
