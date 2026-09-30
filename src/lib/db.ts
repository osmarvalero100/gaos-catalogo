import mysql from 'mysql2/promise';
import crypto from 'crypto';
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
 * Also configures user authentication tables and migrates existing catalogs to gaos.storeco@gmail.com.
 */
export async function initDatabase(): Promise<void> {
  if (global.__dbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const pool = getPool();

    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_expires (expires_at),
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Create catalogs table
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
        user_id INT NULL,
        featured_section_title VARCHAR(255) DEFAULT 'Colección Destacada',
        regular_section_title VARCHAR(255) DEFAULT 'Velas & Aromas',
        footer_text VARCHAR(255) NULL,
        theme_config JSON NOT NULL,
        contact_info JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure user_id column exists in existing catalogs table
    try {
      const [cols] = await pool.query<mysql.RowDataPacket[]>(
        "SHOW COLUMNS FROM catalogs LIKE 'user_id'"
      );
      if (cols.length === 0) {
        await pool.query(
          "ALTER TABLE catalogs ADD COLUMN user_id INT NULL AFTER intro_text, ADD INDEX idx_user_id (user_id)"
        );
      }
    } catch (migErr) {
      console.warn('Could not check or alter user_id column in catalogs:', migErr);
    }

    // Ensure section titles columns exist in existing catalogs table
    try {
      const [cols] = await pool.query<mysql.RowDataPacket[]>(
        "SHOW COLUMNS FROM catalogs LIKE 'featured_section_title'"
      );
      if (cols.length === 0) {
        await pool.query(
          "ALTER TABLE catalogs ADD COLUMN featured_section_title VARCHAR(255) DEFAULT 'Colección Destacada' AFTER intro_text, ADD COLUMN regular_section_title VARCHAR(255) DEFAULT 'Velas & Aromas' AFTER featured_section_title"
        );
      }
    } catch (migErr) {
      console.warn('Could not check or alter section titles columns in catalogs:', migErr);
    }

    // Ensure footer_text column exists in existing catalogs table
    try {
      const [cols] = await pool.query<mysql.RowDataPacket[]>(
        "SHOW COLUMNS FROM catalogs LIKE 'footer_text'"
      );
      if (cols.length === 0) {
        await pool.query(
          "ALTER TABLE catalogs ADD COLUMN footer_text VARCHAR(255) NULL AFTER regular_section_title"
        );
      }
    } catch (migErr) {
      console.warn('Could not check or alter footer_text column in catalogs:', migErr);
    }

    // 4. Create products table
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
        includes JSON,
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

    // Ensure includes column exists in existing products table
    try {
      const [cols] = await pool.query<mysql.RowDataPacket[]>(
        "SHOW COLUMNS FROM products LIKE 'includes'"
      );
      if (cols.length === 0) {
        await pool.query('ALTER TABLE products ADD COLUMN includes JSON AFTER colors');
      }
    } catch (migErr) {
      console.warn('Could not check or alter includes column:', migErr);
    }

    // 5. Ensure default user gaos.storeco@gmail.com exists (Password: G40sC@ndles)
    let defaultUserId: number | null = null;
    const [userRows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      ['gaos.storeco@gmail.com']
    );

    if (userRows.length === 0) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync('G40sC@ndles', salt, 64).toString('hex');
      const [insertRes] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        ['gaos.storeco@gmail.com', `${salt}:${hash}`, 'GAOS CANDLES']
      );
      defaultUserId = insertRes.insertId;
      console.log(`Created default user gaos.storeco@gmail.com with ID ${defaultUserId}`);
    } else {
      defaultUserId = Number(userRows[0].id);
    }

    // 6. Associate all existing unowned catalogs to gaos.storeco@gmail.com
    if (defaultUserId) {
      await pool.query(
        'UPDATE catalogs SET user_id = ? WHERE user_id IS NULL OR user_id = 0',
        [defaultUserId]
      );
    }

    global.__dbInitialized = true;

    // 7. Check if any catalog exists; if not, seed the initial catalog with defaultUserId
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM catalogs');
    const count = rows[0]?.count || 0;

    if (count === 0) {
      console.log('Seeding initial catalog into MySQL database...');
      await saveCatalogToDb({ ...INITIAL_CATALOG, userId: defaultUserId || undefined }, defaultUserId || undefined);
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
  userId?: number;
  updatedAt: string;
}

/**
 * Lists catalogs with product count and metadata.
 * If userId is provided, returns ONLY catalogs owned by that user.
 */
export async function getAllCatalogs(userId?: number): Promise<CatalogListItem[]> {
  await initDatabase();
  const pool = getPool();

  const query = `
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
      c.user_id as userId,
      c.updated_at as updatedAt,
      COUNT(p.id) as productCount
    FROM catalogs c
    LEFT JOIN products p ON c.id = p.catalog_id
    ${userId ? 'WHERE c.user_id = ?' : ''}
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `;

  const [rows] = await pool.query<mysql.RowDataPacket[]>(query, userId ? [userId] : []);

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
    userId: r.userId ? Number(r.userId) : undefined,
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
    includes: typeof p.includes === 'string' ? JSON.parse(p.includes) : p.includes || [],
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
    featuredSectionTitle: c.featured_section_title || 'Colección Destacada',
    regularSectionTitle: c.regular_section_title || 'Velas & Aromas',
    footerText: c.footer_text || undefined,
    products,
    theme,
    contact,
    userId: c.user_id ? Number(c.user_id) : undefined,
    updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Saves (creates or updates) a catalog and its products in a transaction.
 * Enforces ownership: only the owner can update an existing catalog.
 */
export async function saveCatalogToDb(catalog: Catalog, userId?: number): Promise<Catalog> {
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

    // Ownership check: If catalog exists, verify that the current user is the owner
    const [existingRows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id, user_id FROM catalogs WHERE id = ? OR slug = ? LIMIT 1',
      [catalogId, slug]
    );

    if (existingRows.length > 0 && userId) {
      const existingOwnerId = existingRows[0].user_id ? Number(existingRows[0].user_id) : null;
      if (existingOwnerId !== null && existingOwnerId !== userId) {
        throw new Error('No tienes permiso para editar este catálogo. Solo el dueño del catálogo puede modificarlo.');
      }
    }

    const effectiveUserId = userId || catalog.userId || (existingRows.length > 0 ? existingRows[0].user_id : null);

    const themeJson = JSON.stringify(catalog.theme || {});
    const contactJson = JSON.stringify(catalog.contact || {});

    // Upsert catalog record
    await connection.query(
      `
      INSERT INTO catalogs (
        id, slug, title, subtitle, season_tag, edition_year,
        brand_name, brand_logo, cover_image, intro_text,
        user_id,
        featured_section_title, regular_section_title, footer_text,
        theme_config, contact_info, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
        user_id = COALESCE(catalogs.user_id, VALUES(user_id)),
        featured_section_title = VALUES(featured_section_title),
        regular_section_title = VALUES(regular_section_title),
        footer_text = VALUES(footer_text),
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
        effectiveUserId,
        catalog.featuredSectionTitle || 'Colección Destacada',
        catalog.regularSectionTitle || 'Velas & Aromas',
        catalog.footerText !== undefined ? catalog.footerText : null,
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
        const includesJson = JSON.stringify(p.includes || []);

        await connection.query(
          `
          INSERT INTO products (
            id, catalog_id, name, sku, price, currency, description,
            height_cm, width_cm, fragrances, colors, includes, image,
            burn_time_hours, wax_type, is_seasonal_special, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            includesJson,
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
      userId: effectiveUserId ? Number(effectiveUserId) : undefined,
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
 * Deletes a catalog and cascades to all its products.
 * If userId is provided, ensures only the owner can delete it.
 */
export async function deleteCatalogFromDb(idOrSlug: string, userId?: number): Promise<boolean> {
  await initDatabase();
  const pool = getPool();
  let query = 'DELETE FROM catalogs WHERE (id = ? OR slug = ?)';
  const params: unknown[] = [idOrSlug, idOrSlug];
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  const [result] = await pool.query<mysql.ResultSetHeader>(query, params);
  return result.affectedRows > 0;
}

/**
 * Duplicates an existing catalog under a new slug and title, assigning it to the requesting user
 */
export async function duplicateCatalogInDb(sourceIdOrSlug: string, userId?: number, newTitle?: string): Promise<Catalog> {
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
    userId: userId || source.userId,
    products: source.products.map((p, idx) => ({
      ...p,
      id: `prod_${timestamp}_${idx}`,
    })),
    updatedAt: new Date().toISOString(),
  };

  return await saveCatalogToDb(duplicated, userId);
}
