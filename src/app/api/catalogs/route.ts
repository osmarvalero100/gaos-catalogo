import { NextResponse } from 'next/server';
import { getAllCatalogs, saveCatalogToDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { INITIAL_CATALOG } from '@/data/defaultCatalog';
import { SEASONAL_PRESETS } from '@/data/seasonalThemes';
import { SeasonKey } from '@/types/catalog';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para ver tus catálogos.' },
        { status: 401 }
      );
    }

    // Only return catalogs owned by the logged-in user
    const catalogs = await getAllCatalogs(user.id);
    return NextResponse.json({ catalogs, userId: user.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al listar catálogos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para crear o guardar catálogos.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // If request contains full catalog object
    if (body.products && body.title) {
      const saved = await saveCatalogToDb(body, user.id);
      return NextResponse.json({ success: true, catalog: saved }, { status: 201 });
    }

    // Creating from scratch or template
    const title = body.title || 'Nuevo Catálogo';
    const season: SeasonKey = body.season || 'navidad';
    const preset = SEASONAL_PRESETS[season] || SEASONAL_PRESETS.navidad;
    const slugBase = (body.slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${slugBase}-${Math.floor(Math.random() * 900 + 100)}`;
    const newId = `catalog_${Date.now()}`;

    const newCatalog = {
      ...INITIAL_CATALOG,
      id: newId,
      slug: uniqueSlug,
      title: title.toUpperCase(),
      subtitle: body.subtitle || `Colección ${preset.name}`,
      seasonTag: preset.name,
      editionYear: new Date().getFullYear().toString(),
      coverImage: preset.defaultCoverImage || INITIAL_CATALOG.coverImage,
      theme: {
        ...INITIAL_CATALOG.theme,
        season,
        palette: preset.theme.palette,
      },
      products: [],
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveCatalogToDb(newCatalog, user.id);
    return NextResponse.json({ success: true, catalog: saved }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear catálogo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
