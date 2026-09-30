import { NextResponse } from 'next/server';
import { getCatalogByIdOrSlug, saveCatalogToDb, deleteCatalogFromDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Public GET: Customers can read any published catalog via /c/[slug] without login
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug no proporcionado' }, { status: 400 });
    }

    const catalog = await getCatalogByIdOrSlug(slug);
    if (!catalog) {
      return NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 });
    }

    // Optional: detect if the current request is from the catalog owner
    const user = await getAuthenticatedUser(request);
    const isOwner = Boolean(user && catalog.userId && user.id === catalog.userId);

    return NextResponse.json({
      ...catalog,
      isOwner,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Protected PUT: Only the catalog owner can edit and save changes
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para editar este catálogo.' },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const catalog = await request.json();

    if (!catalog) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
    }

    if (!catalog.slug) {
      catalog.slug = slug;
    }

    const saved = await saveCatalogToDb(catalog, user.id);
    return NextResponse.json({ success: true, catalog: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar catálogo';
    const status = message.includes('No tienes permiso') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * Protected DELETE: Only the owner can delete the catalog
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para eliminar este catálogo.' },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    const deleted = await deleteCatalogFromDb(slug, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Catálogo no encontrado o no tienes permiso para eliminarlo.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Catálogo eliminado correctamente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar catálogo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
