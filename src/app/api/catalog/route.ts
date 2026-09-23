import { NextResponse } from 'next/server';
import { saveCatalogToDb, getCatalogByIdOrSlug, getAllCatalogs } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

const CATALOGS_DIR = path.join(process.cwd(), 'data', 'catalogs');

export async function POST(request: Request) {
  try {
    const catalog = await request.json();

    if (!catalog || (!catalog.id && !catalog.title)) {
      return NextResponse.json(
        { error: 'Datos de catálogo inválidos' },
        { status: 400 }
      );
    }

    // 1. Save to persistent MySQL database
    const saved = await saveCatalogToDb(catalog);

    // 2. Also keep a local JSON backup on disk for offline safety
    try {
      await fs.mkdir(CATALOGS_DIR, { recursive: true });
      const safeSlug = (saved.slug || 'catalogo').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const filePath = path.join(CATALOGS_DIR, `${safeSlug}.json`);
      await fs.writeFile(filePath, JSON.stringify(saved, null, 2), 'utf-8');
      await fs.writeFile(path.join(CATALOGS_DIR, 'current.json'), JSON.stringify(saved, null, 2), 'utf-8');
    } catch (diskErr) {
      console.warn('Warning: Could not write secondary disk backup', diskErr);
    }

    return NextResponse.json({
      success: true,
      catalog: saved,
      source: 'mysql',
      savedAt: saved.updatedAt,
    });
  } catch (error: unknown) {
    console.error('Error saving catalog to MySQL:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al guardar el catálogo en la base de datos', details: message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug && slug !== 'current') {
      const catalog = await getCatalogByIdOrSlug(slug);
      if (catalog) {
        return NextResponse.json(catalog);
      }
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 });
    }

    // If slug is 'current' or omitted, return either current or all catalogs list
    if (slug === 'current') {
      const list = await getAllCatalogs();
      if (list.length > 0) {
        const first = await getCatalogByIdOrSlug(list[0].slug);
        return NextResponse.json(first);
      }
    }

    const catalogs = await getAllCatalogs();
    return NextResponse.json({ catalogs });
  } catch (error: unknown) {
    console.error('Error fetching catalogs from MySQL:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al consultar la base de datos', details: message },
      { status: 500 }
    );
  }
}
