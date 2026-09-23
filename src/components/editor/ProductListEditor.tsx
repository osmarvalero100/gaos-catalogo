import React, { useState } from 'react';
import { Product, Catalog } from '../../types/catalog';
import { ProductFormModal } from './ProductFormModal';
import { VisualDimensionIndicator } from '../preview/VisualDimensionIndicator';
import { Plus, Edit2, Trash2, Copy, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { SEASONAL_PRESETS } from '../../data/seasonalThemes';

interface ProductListEditorProps {
  catalog: Catalog;
  onChange: (products: Product[]) => void;
}

export const ProductListEditor: React.FC<ProductListEditorProps> = ({
  catalog,
  onChange,
}) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = (savedProduct: Product) => {
    if (editingProduct) {
      // Update existing
      onChange(catalog.products.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
    } else {
      // Add new
      onChange([...catalog.products, savedProduct]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta vela del catálogo?')) {
      onChange(catalog.products.filter((p) => p.id !== id));
    }
  };

  const handleDuplicate = (product: Product) => {
    const copy: Product = {
      ...product,
      id: `candle-${Date.now()}`,
      name: `${product.name} (Copia)`,
      sku: `${product.sku || 'CP'}-B`,
    };
    onChange([...catalog.products, copy]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catalog.products.length) return;

    const updated = [...catalog.products];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange(updated);
  };

  const suggestedFragrances =
    SEASONAL_PRESETS[catalog.theme.season]?.sampleFragrances || [];

  return (
    <div className="space-y-4">
      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            Velas en el Catálogo ({catalog.products.length})
          </h3>
          <p className="text-xs text-stone-500">
            Organiza, edita o agrega tus productos artesanales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Vela</span>
        </button>
      </div>

      {/* Product items list */}
      {catalog.products.length === 0 ? (
        <div className="text-center py-10 px-4 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
          <p className="text-sm text-stone-600 font-medium mb-3">
            No tienes velas en este catálogo todavía.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg"
          >
            Agregar tu primera vela
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {catalog.products.map((prod, index) => (
            <div
              key={prod.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white border border-stone-200 rounded-xl shadow-2xs hover:border-stone-300 transition-all gap-3"
            >
              {/* Product Left: Image & Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 text-stone-400">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:text-stone-900 disabled:opacity-20"
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === catalog.products.length - 1}
                    className="p-1 hover:text-stone-900 disabled:opacity-20"
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {prod.name}
                    </h4>
                    {prod.sku && (
                      <span className="text-[10px] font-mono uppercase bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                        {prod.sku}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-stone-500">
                    <span className="font-semibold text-emerald-800">
                      {catalog.theme.currencySymbol}
                      {prod.price.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-0.5 font-mono">
                      ↕ {prod.heightCm}cm × ↔ {prod.widthCm}cm
                    </span>
                    {prod.fragrances && prod.fragrances.length > 0 && (
                      <span className="truncate max-w-[150px]">
                        {prod.fragrances.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual compact indicator */}
              <div className="hidden lg:block">
                <VisualDimensionIndicator
                  heightCm={prod.heightCm}
                  widthCm={prod.widthCm}
                  color={catalog.theme.palette.primary}
                  compact={true}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleEdit(prod)}
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Editar vela"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(prod)}
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Duplicar vela"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(prod.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar vela"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding/editing product */}
      <ProductFormModal
        key={editingProduct ? editingProduct.id : 'new-candle-modal'}
        isOpen={isModalOpen}
        product={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        currencySymbol={catalog.theme.currencySymbol}
        suggestedFragrances={suggestedFragrances}
      />
    </div>
  );
};
