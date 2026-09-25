import React from 'react';
import { Catalog } from '../../types/catalog';
import { BookOpen, Phone, AtSign, MapPin, Upload, Globe } from 'lucide-react';

interface BrandContactEditorProps {
  catalog: Catalog;
  onChange: (catalog: Catalog) => void;
}

export const BrandContactEditor: React.FC<BrandContactEditorProps> = ({
  catalog,
  onChange,
}) => {
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange({
          ...catalog,
          coverImage: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange({
          ...catalog,
          brandLogo: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Catalog Title & Subtitle */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          Textos de Portada & Presentación
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Nombre de tu Marca / Taller
            </label>
            <input
              type="text"
              value={catalog.brandName}
              onChange={(e) => onChange({ ...catalog, brandName: e.target.value })}
              placeholder="Ej. GAOS CANDLES"
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Año / Edición
            </label>
            <input
              type="text"
              value={catalog.editionYear}
              onChange={(e) => onChange({ ...catalog, editionYear: e.target.value })}
              placeholder="2026"
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Título Principal del Catálogo
          </label>
          <input
            type="text"
            value={catalog.title}
            onChange={(e) => onChange({ ...catalog, title: e.target.value })}
            placeholder="COLECCIÓN BOTÁNICA NAVIDEÑA"
            className="w-full px-3 py-2 text-xs font-serif text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Subtítulo Descriptivo
          </label>
          <input
            type="text"
            value={catalog.subtitle}
            onChange={(e) => onChange({ ...catalog, subtitle: e.target.value })}
            placeholder="Velas Aromáticas Vertidas a Mano · Edición Especial Festiva"
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Etiqueta de Temporada
          </label>
          <input
            type="text"
            value={catalog.seasonTag}
            onChange={(e) => onChange({ ...catalog, seasonTag: e.target.value })}
            placeholder="Navidad 2026 / Amor y Amistad / Día de las Madres"
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        {/* Categoría / Enlace de la URL (Slug) */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              Categoría / Enlace de la URL (Slug)
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              /c/{catalog.slug || 'velas'}
            </span>
          </label>
          <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-600 focus-within:border-emerald-600">
            <span className="px-3 py-2 text-xs font-mono text-stone-400 bg-stone-100 border-r border-stone-200 select-none">
              /c/
            </span>
            <input
              type="text"
              value={catalog.slug || ''}
              onChange={(e) => {
                const formatted = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-_]/g, '');
                onChange({ ...catalog, slug: formatted });
              }}
              placeholder="velas-navidad-2026"
              className="flex-1 px-3 py-2 text-xs font-mono bg-white focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Define la dirección web de tu catálogo para compartir con clientes (ejemplo: <span className="font-mono text-stone-600">velas-navidad-2026</span>, <span className="font-mono text-stone-600">boda-sofia</span> o <span className="font-mono text-stone-600">aromas-otono</span>).
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Texto Editorial de Bienvenida / Filosofía de Marca
          </label>
          <textarea
            rows={3}
            value={catalog.introText}
            onChange={(e) => onChange({ ...catalog, introText: e.target.value })}
            placeholder="Explica a tus clientes el proceso artesanal de tus velas, las ceras naturales empleadas y la magia del producto..."
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Fotografía Principal de Portada
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
              <img
                src={catalog.coverImage}
                alt="Portada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-medium cursor-pointer hover:bg-stone-50 shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>Cambiar Foto de Portada</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={catalog.coverImage}
                onChange={(e) => onChange({ ...catalog, coverImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Brand Logo */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center justify-between">
            <span>Logo de la Marca / Taller</span>
            <span className="text-[10px] text-stone-400 font-mono">
              SVG, PNG o JPG
            </span>
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-stone-200 bg-white flex-shrink-0 flex items-center justify-center p-1.5 shadow-2xs">
              <img
                src={catalog.brandLogo || '/gaos-candles.svg'}
                alt="Logo de Marca"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-medium cursor-pointer hover:bg-stone-50 shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Subir Nuevo Logo</span>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ ...catalog, brandLogo: '/gaos-candles.svg' })}
                  className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-[11px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title="Restablecer al logo predeterminado de GAOS CANDLES"
                >
                  Restablecer por Defecto
                </button>
              </div>
              <input
                type="text"
                value={catalog.brandLogo || ''}
                onChange={(e) => onChange({ ...catalog, brandLogo: e.target.value })}
                placeholder="/gaos-candles.svg o URL externa"
                className="w-full px-3 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Orders info for Contraportada & WhatsApp */}
      <div className="space-y-4 pt-4 border-t">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-emerald-700" />
          Datos de Contacto & Pedidos por WhatsApp
        </label>
        <p className="text-xs text-stone-500">
          Estos datos se usarán en los botones de pedido y en la contraportada del catálogo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Número de WhatsApp (con código de país)
            </label>
            <input
              type="text"
              value={catalog.contact.whatsapp}
              onChange={(e) =>
                onChange({
                  ...catalog,
                  contact: { ...catalog.contact, whatsapp: e.target.value },
                })
              }
              placeholder="+57 300 123 4567"
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5 text-rose-600" />
              Usuario de Instagram
            </label>
            <input
              type="text"
              value={catalog.contact.instagram}
              onChange={(e) =>
                onChange({
                  ...catalog,
                  contact: { ...catalog.contact, instagram: e.target.value },
                })
              }
              placeholder="@tumarca.velas"
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone-500" />
            Ubicación & Cobertura de Envíos
          </label>
          <input
            type="text"
            value={catalog.contact.location || ''}
            onChange={(e) =>
              onChange({
                ...catalog,
                contact: { ...catalog.contact, location: e.target.value },
              })
            }
            placeholder="Envíos a todo el país · Entregas personalizadas"
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Políticas de Pedido & Tiempos de Entrega
          </label>
          <textarea
            rows={2}
            value={catalog.contact.deliveryNotes || ''}
            onChange={(e) =>
              onChange({
                ...catalog,
                contact: { ...catalog.contact, deliveryNotes: e.target.value },
              })
            }
            placeholder="Pedidos con 3 a 5 días de anticipación. Empaque de regalo festivo incluido."
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
