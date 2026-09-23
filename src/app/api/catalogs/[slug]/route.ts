import { NextResponse } from 'next/server';
import { getCatalogByIdOrSlug, saveCatalogToDb, deleteCatalogFromDb } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

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

    return NextResponse.json(catalog);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const catalog = await request.json();

    if (!catalog) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 });
    }

    // Ensure slug consistency if needed
    if (!catalog.slug) {
      catalog.slug = slug;
    }

    const saved = await saveCatalogToDb(catalog);
    return NextResponse.json({ success: true, catalog: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar catálogo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const deleted = await deleteCatalogFromDb(slug);

    if (!deleted) {
      return NextResponse.json({ error: 'Catálogo no encontrado para eliminar' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Catálogo eliminado correctamente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar catálogo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
