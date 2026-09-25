import mysql from 'mysql2/promise';
import { Catalog, Product } from '../types/catalog';
import { INITIAL_CATALOG } from '../data/defaultCatalog';

// Global connection pool singleton to prevent exhausting connections in Next.js dev hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: mysql.Pool | undefined;
  // eslint-disable-next-line no-var
  var __dbInitialized: boolean | undefined;
}

export function getPool(): mysql.Pool {
  if (!global.__dbPool) {
    const host = process.env.DB_HOST || '85.31.63.21';
    const port = Number(process.env.DB_PORT || 3904);
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || 'N3uoW*sz3wa*';
    const database = process.env.DB_NAME || 'gaos_catalogo';

    global.__dbPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 5,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4',
    });
  }
  return global.__dbPool;
}

let initPromise: Promise<void> | null = null;

/**
 * Initializes MySQL tables if they do not exist and seeds initial catalog if database is empty.
 */
export async function initDatabase(): Promise<void> {
  if (global.__dbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const pool = getPool();

    // Create catalogs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS catalogs (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(128) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) DEFAULT '',
        season_tag VARCHAR(100) DEFAULT '',
        edition_year VARCHAR(50) DEFAULT '',
        brand_name VARCHAR(255) NOT NULL DEFAULT '',
        brand_logo LONGTEXT,
        cover_image LONGTEXT,
        intro_text TEXT,
        theme_config JSON NOT NULL,
        contact_info JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        catalog_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) DEFAULT '',
        price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT '$',
        description TEXT,
        height_cm DECIMAL(6, 2) DEFAULT 0.00,
        width_cm DECIMAL(6, 2) DEFAULT 0.00,
        fragrances JSON,
        colors JSON,
        image LONGTEXT,
        burn_time_hours INT DEFAULT NULL,
        wax_type VARCHAR(100) DEFAULT '',
        is_seasonal_special TINYINT(1) DEFAULT 0,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_catalog_sort (catalog_id, sort_order),
        CONSTRAINT fk_products_catalog FOREIGN KEY (catalog_id)
          REFERENCES catalogs (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    global.__dbInitialized = true;

    // Check if any catalog exists; if not, seed the initial catalog
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM catalogs');
    const count = rows[0]?.count || 0;

    if (count === 0) {
      console.log('Seeding initial catalog into MySQL database...');
      await saveCatalogToDb(INITIAL_CATALOG);
    }
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export interface CatalogListItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  seasonTag: string;
  editionYear: string;
  brandName: string;
  coverImage: string;
  productCount: number;
  season: string;
  updatedAt: string;
}

/**
 * Lists all catalogs with product count and metadata
 */
export async function getAllCatalogs(): Promise<CatalogListItem[]> {
  await initDatabase();
  const pool = getPool();

  const [rows] = await pool.query<mysql.RowDataPacket[]>(`
    SELECT 
      c.id,
      c.slug,
      c.title,
      c.subtitle,
      c.season_tag as seasonTag,
      c.edition_year as editionYear,
      c.brand_name as brandName,
      c.cover_image as coverImage,
      c.theme_config->>'$.season' as season,
      c.updated_at as updatedAt,
      COUNT(p.id) as productCount
    FROM catalogs c
    LEFT JOIN products p ON c.id = p.catalog_id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle || '',
    seasonTag: r.seasonTag || '',
    editionYear: r.editionYear || '',
    brandName: r.brandName || '',
    coverImage: r.coverImage || '',
    season: r.season || 'navidad',
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    productCount: Number(r.productCount || 0),
  }));
}

/**
 * Gets a full catalog by ID or Slug, including all products ordered by sort_order
 */
export async function getCatalogByIdOrSlug(idOrSlug: string): Promise<Catalog | null> {
  await initDatabase();
  const pool = getPool();

  const [catalogRows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT * FROM catalogs WHERE id = ? OR slug = ? LIMIT 1',
    [idOrSlug, idOrSlug]
  );

  if (!catalogRows || catalogRows.length === 0) {
    return null;
  }

  const c = catalogRows[0];

  const [productRows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT * FROM products WHERE catalog_id = ? ORDER BY sort_order ASC, created_at ASC',
    [c.id]
  );

  const products: Product[] = productRows.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku || undefined,
    price: Number(p.price || 0),
    currency: p.currency || '$',
    description: p.description || '',
    heightCm: Number(p.height_cm || 0),
    widthCm: Number(p.width_cm || 0),
    fragrances: typeof p.fragrances === 'string' ? JSON.parse(p.fragrances) : p.fragrances || [],
    colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors || [],
    image: p.image || '',
    burnTimeHours: p.burnTimeHours != null ? Number(p.burn_time_hours) : (p.burn_time_hours != null ? Number(p.burn_time_hours) : undefined),
    waxType: p.wax_type || undefined,
    isSeasonalSpecial: Boolean(p.is_seasonal_special),
  }));

  const theme = typeof c.theme_config === 'string' ? JSON.parse(c.theme_config) : c.theme_config;
  const contact = typeof c.contact_info === 'string' ? JSON.parse(c.contact_info) : c.contact_info;

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle || '',
    seasonTag: c.season_tag || '',
    editionYear: c.edition_year || '',
    brandName: c.brand_name || '',
    brandLogo: c.brand_logo || '/gaos-candles.svg',
    coverImage: c.cover_image || '',
    introText: c.intro_text || '',
    products,
    theme,
    contact,
    updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Saves (creates or updates) a catalog and its products in a transaction
 */
export async function saveCatalogToDb(catalog: Catalog): Promise<Catalog> {
  await initDatabase();
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const catalogId = catalog.id || `catalog_${Date.now()}`;
    const slug = (catalog.slug || `catalogo-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');

    const themeJson = JSON.stringify(catalog.theme || {});
    const contactJson = JSON.stringify(catalog.contact || {});

    // Upsert catalog record
    await connection.query(
      `
      INSERT INTO catalogs (
        id, slug, title, subtitle, season_tag, edition_year,
        brand_name, brand_logo, cover_image, intro_text,
        theme_config, contact_info, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        slug = VALUES(slug),
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        season_tag = VALUES(season_tag),
        edition_year = VALUES(edition_year),
        brand_name = VALUES(brand_name),
        brand_logo = VALUES(brand_logo),
        cover_image = VALUES(cover_image),
        intro_text = VALUES(intro_text),
        theme_config = VALUES(theme_config),
        contact_info = VALUES(contact_info),
        updated_at = NOW()
      `,
      [
        catalogId,
        slug,
        catalog.title || 'Catálogo',
        catalog.subtitle || '',
        catalog.seasonTag || '',
        catalog.editionYear || '',
        catalog.brandName || '',
        catalog.brandLogo || '/gaos-candles.svg',
        catalog.coverImage || '',
        catalog.introText || '',
        themeJson,
        contactJson,
      ]
    );

    // Synchronize products:
    // Delete existing products for this catalog and reinsert to maintain exact order and deletions
    await connection.query('DELETE FROM products WHERE catalog_id = ?', [catalogId]);

    if (catalog.products && catalog.products.length > 0) {
      for (let i = 0; i < catalog.products.length; i++) {
        const p = catalog.products[i];
        const productId = p.id || `prod_${Date.now()}_${i}`;
        const fragrancesJson = JSON.stringify(p.fragrances || []);
        const colorsJson = JSON.stringify(p.colors || []);

        await connection.query(
          `
          INSERT INTO products (
            id, catalog_id, name, sku, price, currency, description,
            height_cm, width_cm, fragrances, colors, image,
            burn_time_hours, wax_type, is_seasonal_special, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            productId,
            catalogId,
            p.name || 'Producto',
            p.sku || '',
            p.price || 0,
            p.currency || '$',
            p.description || '',
            p.heightCm || 0,
            p.widthCm || 0,
            fragrancesJson,
            colorsJson,
            p.image || '',
            p.burnTimeHours ?? null,
            p.waxType || '',
            p.isSeasonalSpecial ? 1 : 0,
            i,
          ]
        );
      }
    }

    await connection.commit();

    return {
      ...catalog,
      id: catalogId,
      slug,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Deletes a catalog and cascades to all its products
 */
export async function deleteCatalogFromDb(idOrSlug: string): Promise<boolean> {
  await initDatabase();
  const pool = getPool();
  const [result] = await pool.query<mysql.ResultSetHeader>(
    'DELETE FROM catalogs WHERE id = ? OR slug = ?',
    [idOrSlug, idOrSlug]
  );
  return result.affectedRows > 0;
}

/**
 * Duplicates an existing catalog under a new slug and title
 */
export async function duplicateCatalogInDb(sourceIdOrSlug: string, newTitle?: string): Promise<Catalog> {
  const source = await getCatalogByIdOrSlug(sourceIdOrSlug);
  if (!source) {
    throw new Error('Catálogo de origen no encontrado');
  }

  const timestamp = Date.now();
  const newId = `catalog_${timestamp}`;
  const baseSlug = source.slug.replace(/-\d+$/, '');
  const newSlug = `${baseSlug}-copia-${Math.floor(Math.random() * 900 + 100)}`;
  const title = newTitle || `${source.title} (Copia)`;

  const duplicated: Catalog = {
    ...source,
    id: newId,
    slug: newSlug,
    title,
    products: source.products.map((p, idx) => ({
      ...p,
      id: `prod_${timestamp}_${idx}`,
    })),
    updatedAt: new Date().toISOString(),
  };

  return await saveCatalogToDb(duplicated);
}
