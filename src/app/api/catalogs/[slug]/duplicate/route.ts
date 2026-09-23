import { NextResponse } from 'next/server';
import { duplicateCatalogInDb } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    let title: string | undefined;

    try {
      const body = await request.json();
      title = body?.title;
    } catch {
      // Body may be empty
    }

    const duplicated = await duplicateCatalogInDb(slug, title);
    return NextResponse.json({ success: true, catalog: duplicated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al duplicar catálogo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
