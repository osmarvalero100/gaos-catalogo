import { NextResponse } from 'next/server';
import { saveCatalogToDb, getCatalogByIdOrSlug, getAllCatalogs } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const CATALOGS_DIR = path.join(process.cwd(), 'data', 'catalogs');

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para guardar cambios en este catálogo.' },
        { status: 401 }
      );
    }

    const catalog = await request.json();

    if (!catalog || (!catalog.id && !catalog.title)) {
      return NextResponse.json(
        { error: 'Datos de catálogo inválidos' },
        { status: 400 }
      );
    }

    // 1. Save to persistent MySQL database with ownership verification
    const saved = await saveCatalogToDb(catalog, user.id);

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
    const status = message.includes('No tienes permiso') ? 403 : 500;
    return NextResponse.json(
      { error: message, details: message },
      { status }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const user = await getAuthenticatedUser(request);

    // Public or specific catalog lookup by slug
    if (slug && slug !== 'current') {
      const catalog = await getCatalogByIdOrSlug(slug);
      if (catalog) {
        return NextResponse.json(catalog);
      }
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 });
    }

    // For 'current' catalog or catalog list, require authentication
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para consultar catálogos en el estudio.' },
        { status: 401 }
      );
    }

    // If slug is 'current', return the most recent catalog owned by this user
    if (slug === 'current') {
      const list = await getAllCatalogs(user.id);
      if (list.length > 0) {
        const first = await getCatalogByIdOrSlug(list[0].slug);
        return NextResponse.json(first);
      }
      return NextResponse.json({ error: 'No tienes catálogos creados aún.' }, { status: 404 });
    }

    // Otherwise return only this user's catalogs
    const catalogs = await getAllCatalogs(user.id);
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
