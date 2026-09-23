import React, { useState, useEffect } from 'react';
import { CatalogListItem } from '@/lib/db';
import { Catalog, SeasonKey } from '@/types/catalog';
import { SEASONAL_PRESETS } from '@/data/seasonalThemes';
import {
  X,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  Edit3,
  Calendar,
  Layers,
  Flame,
  Check,
  Loader2,
  Database,
  Sparkles,
} from 'lucide-react';

interface CatalogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCatalogId: string;
  onSelectCatalog: (catalog: Catalog) => void;
}

export const CatalogManagerModal: React.FC<CatalogManagerModalProps> = ({
  isOpen,
  onClose,
  currentCatalogId,
  onSelectCatalog,
}) => {
  const [catalogs, setCatalogs] = useState<CatalogListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // New Catalog Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newSeason, setNewSeason] = useState<SeasonKey>('navidad');
  const [newSlug, setNewSlug] = useState('');

  const fetchCatalogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/catalogs');
      if (res.ok) {
        const data = await res.json();
        setCatalogs(data.catalogs || []);
      }
    } catch (err) {
      console.error('Error fetching catalogs list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setActionLoadingId('new');
    try {
      const res = await fetch('/api/catalogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          subtitle: newSubtitle.trim(),
          season: newSeason,
          slug: newSlug.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.catalog) {
          onSelectCatalog(data.catalog);
          onClose();
        }
      } else {
        alert('Error al crear el catálogo en la base de datos.');
      }
    } catch (err) {
      console.error('Error creating catalog:', err);
      alert('Error de conexión con la base de datos.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelect = async (slug: string) => {
    setActionLoadingId(slug);
    try {
      const res = await fetch(`/api/catalogs/${slug}`);
      if (res.ok) {
        const fullCatalog = await res.json();
        onSelectCatalog(fullCatalog);
        onClose();
      } else {
        alert('No se pudo cargar el catálogo.');
      }
    } catch (err) {
      console.error('Error loading catalog:', err);
      alert('Error de conexión al cargar el catálogo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (slug: string) => {
    setActionLoadingId(`dup_${slug}`);
    try {
      const res = await fetch(`/api/catalogs/${slug}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        await fetchCatalogs();
        if (data.catalog) {
          onSelectCatalog(data.catalog);
          onClose();
        }
      } else {
        alert('Error al duplicar el catálogo.');
      }
    } catch (err) {
      console.error('Error duplicating catalog:', err);
      alert('Error de conexión al duplicar el catálogo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (catalogs.length <= 1) {
      alert('No puedes eliminar el único catálogo existente.');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el catálogo "${title}" de la base de datos? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionLoadingId(`del_${slug}`);
    try {
      const res = await fetch(`/api/catalogs/${slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchCatalogs();
      } else {
        alert('Error al eliminar el catálogo.');
      }
    } catch (err) {
      console.error('Error deleting catalog:', err);
      alert('Error de conexión al eliminar el catálogo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-stone-900">
                  Gestor de Catálogos
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  MySQL Cloud
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Administra, crea y cambia entre tus catálogos persistentes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={() => {
                  setIsCreating(true);
                  setNewTitle('');
                  setNewSubtitle('');
                  setNewSlug('');
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Catálogo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100/60">
          {/* New Catalog Creation Form View */}
          {isCreating ? (
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Crear Nuevo Catálogo</h3>
                  <p className="text-xs text-stone-500">
                    Se guardará de forma persistente en tu base de datos MySQL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-medium"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleCreateCatalog} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Plantilla / Colección Temática
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(SEASONAL_PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setNewSeason(preset.id);
                          if (!newTitle) setNewTitle(preset.defaultTitle);
                          if (!newSubtitle) setNewSubtitle(preset.defaultSubtitle);
                        }}
                        className={`p-2.5 rounded-lg text-left text-xs border transition-all ${
                          newSeason === preset.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/20'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span className="block text-sm mb-0.5">{preset.badge.split(' ')[0]}</span>
                        <span className="font-medium truncate block">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Título Principal del Catálogo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (!newSlug) {
                        setNewSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                    placeholder="Ej. COLECCIÓN AROMAS DE OTOÑO"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Subtítulo / Descripción de Portada
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="Ej. Velas Botánicas & Cera de Soya Natural · 2026"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Enlace Personalizado (Slug URL)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 text-xs text-stone-500 bg-stone-100 border border-r-0 border-stone-300 rounded-l-lg select-none">
                      /c/
                    </span>
                    <input
                      type="text"
                      value={newSlug}
                      onChange={(e) =>
                        setNewSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_-]/g, '-')
                        )
                      }
                      placeholder="velas-otono-2026"
                      className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-r-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoadingId === 'new' || !newTitle.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {actionLoadingId === 'new' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creando en MySQL...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Crear Catálogo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-stone-500">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mb-3" />
                  <p className="text-xs font-medium">Cargando catálogos de MySQL...</p>
                </div>
              ) : catalogs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
                  <Flame className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-stone-700 mb-1">
                    No hay catálogos registrados
                  </h4>
                  <p className="text-xs text-stone-500 mb-4">
                    Crea tu primer catálogo en la base de datos para comenzar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear mi primer catálogo</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogs.map((item) => {
                    const isActive = item.id === currentCatalogId || item.slug === currentCatalogId;
                    const isItemLoading =
                      actionLoadingId === item.slug ||
                      actionLoadingId === `dup_${item.slug}` ||
                      actionLoadingId === `del_${item.slug}`;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden shadow-2xs ${
                          isActive
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'border-stone-200 hover:border-stone-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Top banner / image */}
                        <div className="h-28 relative overflow-hidden bg-stone-900">
                          {item.coverImage ? (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-r from-emerald-950 to-stone-900" />
                          )}

                          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-stone-800 backdrop-blur-xs">
                                {item.seasonTag || 'Catálogo'}
                              </span>

                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                                  <Check className="w-3 h-3" />
                                  <span>Activo en Editor</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-mono text-stone-300">
                              /c/{item.slug}
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-serif font-bold text-sm text-stone-900 line-clamp-1 mb-0.5">
                              {item.title}
                            </h3>
                            {item.subtitle && (
                              <p className="text-xs text-stone-500 line-clamp-1 mb-3">
                                {item.subtitle}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-[11px] text-stone-500 mb-4 pt-2 border-t border-stone-100">
                              <div className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-amber-500" />
                                <span>{item.productCount} {item.productCount === 1 ? 'producto' : 'productos'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                            <div className="flex items-center gap-1.5">
                              {/* Open Customer Link */}
                              <a
                                href={`/c/${item.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver vista pública de clientes"
                                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {/* Duplicate Catalog */}
                              <button
                                type="button"
                                onClick={() => handleDuplicate(item.slug)}
                                disabled={isItemLoading}
                                title="Duplicar catálogo como copia editable"
                                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 transition-colors disabled:opacity-50"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Catalog */}
                              <button
                                type="button"
                                onClick={() => handleDelete(item.slug, item.title)}
                                disabled={isItemLoading || catalogs.length <= 1}
                                title="Eliminar catálogo de MySQL"
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Select / Edit Button */}
                            {isActive ? (
                              <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              >
                                Editando ahora
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelect(item.slug)}
                                disabled={isItemLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                              >
                                {isItemLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Edit3 className="w-3 h-3" />
                                )}
                                <span>Cargar en Editor</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-stone-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Servidor MySQL: <strong className="font-mono text-stone-700">85.31.63.21:3904</strong></span>
            <span className="text-stone-300">|</span>
            <span>BD: <strong className="font-mono text-stone-700">gaos_catalogo</strong></span>
          </div>
          <div>
            <span>Total: <strong>{catalogs.length}</strong> {catalogs.length === 1 ? 'catálogo' : 'catálogos'} guardados</span>
          </div>
        </div>
      </div>
    </div>
  );
};
