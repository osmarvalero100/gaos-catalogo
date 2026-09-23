# 🕯️ Generador de Catálogos de Velas Artesanales & Productos de Temporada

Un generador de catálogos web interactivo y de alta gama inspirado en el diseño editorial minimalista y de lujo (estilo revista A4), especialmente diseñado para artesanos y marcas de velas aromáticas, productos botánicos y colecciones estacionales (Navidad, San Valentín / Amor y Amistad, Día de las Madres, Otoño, etc.).

Construido con **Next.js (App Router)**, **TypeScript** y **Tailwind CSS**.

---

## ✨ Características Principales

### 1. 🎨 Parametrización de Colecciones y Temporadas
- **Colecciones predefinidas con un clic:**
  - 🎄 **Navidad & Fin de Año**: Tonos verde abeto, dorados festivos, especias cálidas y pino silvestre.
  - ❤️ **Amor y Amistad / San Valentín**: Borgoña profundo, rosa empolvado y notas dulces de rosas y vainilla.
  - 🌸 **Día de las Madres**: Lavandas suaves, salvia y alabastro con aromas relajantes y florales.
  - 🍂 **Otoño & Cosecha**: Terracotas, ámbar y aromas especiados.
  - 🌿 **Editorial & Minimalista**: Estética nórdica limpia como revista de diseño contemporáneo.
  - ✨ **Personalizado**: Paleta de colores libre para tu propia marca.
- **Selectores de color en tiempo real:** Color primario, secundario, de acento (precios) y color de lienzo de página.

### 2. 📐 Indicador Visual y Parametrizado de Dimensiones
- **Silueta gráfica interactiva de la vela:** Dibuja a escala proporcional la forma cilíndrica/escultural con su mecha y llama.
- **Líneas de cota:** Muestra claramente el **Alto (↕ cm)** y el **Ancho / Diámetro (↔ cm)** con diseño vectorial.
- Se actualiza en vivo al modificar las medidas en el formulario.

### 3. 🕯️ Gestión Integral de Cada Vela
- **Nombre y Código (SKU).**
- **Precio con moneda parametrizable** (`$`, `COP $`, `USD $`, `€`, `MXN $`).
- **Descripción corta y sensorial** (notas botánicas, cera utilizada, acabado).
- **Carga de imágenes:**
  - Subida directa de fotos desde tu computadora/celular (JPG, PNG, WebP).
  - Enlace por URL externa.
  - Galería incorporada de fotografías de estudio de velas para usar al instante.
- **Etiquetas de fragancias interactivas** (añadir, remover o elegir de las sugerencias de temporada).
- **Muestrario de colores (swatches):** Selector de color visual con nombre para indicar variantes disponibles de ceras o recipientes.
- **Detalles técnicos:** Tiempo estimado de quemado en horas y tipo de cera.
- **Insignia "Edición Especial"** de temporada.

### 4. 📄 Generación de Catálogo en PDF
- **Descarga directa en 1 clic:** Exporta un archivo `.pdf` en formato A4 listo para enviar por WhatsApp o correo.
- **Modo Imprenta de alta fidelidad (`window.print()`):** Hojas con corte A4 exacto (`210mm x 297mm`), saltos de página limpios y tipografía vectorial súper nítida sin compresión.

### 5. 🌐 Generación de URL Compartible para Clientes
- Genera un enlace público único (`/c/[slug]`) que puedes enviar a clientes por WhatsApp o redes sociales.
- **Vista interactiva adaptable:**
  - **Modo Revista Editorial (Páginas A4):** Paginación idéntica al catálogo impreso.
  - **Modo Cuadrícula Móvil:** Navegación en tarjetas verticales especialmente optimizada para smartphones.
- **Buscador interactivo** por nombre o familia olfativa.
- **Botón de pedido directo a WhatsApp:** Abre el chat con un mensaje pre-cargado con el nombre y precio de la vela que el cliente desea comprar.

### 6. 🗄️ Base de Datos MySQL Persistente & Gestión Multi-Catálogo
- **Persistencia en la Nube:** Conectado directamente a base de datos MySQL 8.0 (`gaos_catalogo`), garantizando que tus catálogos, productos, fotos, cotas y estilos nunca se pierdan.
- **Gestor Multi-Catálogo integrado:**
  - Crea múltiples catálogos independientes (Navidad, San Valentín, Día de las Madres, Colecciones Estacionales, etc.).
  - Cambia entre catálogos activos con un solo clic desde la barra superior («Mis Catálogos»).
  - Duplica catálogos completos para crear nuevas temporadas sin empezar de cero.
  - Elimina catálogos obsoletos con confirmación de seguridad.
- **Actualización en Tiempo Real:** Al modificar precios, velas o fotos en el Estudio y pulsar «Guardar», cualquier cliente que visite el enlace `/c/[slug]` verá los cambios al instante.
- **API RESTful completa:** Endpoints optimizados en `/api/catalogs` y `/api/catalogs/[slug]` con transacciones ACID y eliminación en cascada.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+ (recomendado Node 20+)
- npm

### Instalación y Ejecución

```bash
# Instalar dependencias (si es la primera vez)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Abre en tu navegador:
- **Estudio de Creación y Edición:** [http://localhost:3000](http://localhost:3000)
- **Vista Pública de Cliente:** [http://localhost:3000/c/velas-navidad-2026](http://localhost:3000/c/velas-navidad-2026)

### Compilación para Producción

```bash
npm run build
npm start
```

---

### Configuración de la Base de Datos (.env.local)

Crea un archivo `.env.local` en la raíz del proyecto (puedes basarte en `.env.example`):

```env
DB_HOST=85.31.63.21
DB_PORT=3904
DB_NAME=gaos_catalogo
DB_USER=root
DB_PASSWORD=N3uoW*sz3wa*
```

Las tablas (`catalogs` y `products`) se crean e inicializan de forma 100% automática al iniciar la aplicación o al ejecutar la primera consulta.

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx              # Layout raíz con fuentes Cormorant, Playfair e Inter
│   ├── globals.css             # Estilos globales y reglas CSS @media print A4
│   ├── page.tsx                # Estudio principal (Editor + Vista Previa + Gestor DB)
│   ├── c/
│   │   └── [slug]/
│   │       └── page.tsx        # Vista pública interactiva conectada a MySQL en vivo
│   └── api/
│       ├── catalog/
│       │   └── route.ts        # Endpoint de guardado y carga compatible
│       └── catalogs/
│           ├── route.ts        # Listado y creación de catálogos en MySQL
│           └── [slug]/
│               ├── route.ts    # Consulta, actualización y eliminación
│               └── duplicate/  # Duplicador instantáneo de catálogos
├── components/
│   ├── editor/
│   │   ├── CatalogEditor.tsx       # Navegación por pestañas del panel de edición
│   │   ├── ThemeCustomizer.tsx     # Selector de temporadas y paletas de color
│   │   ├── ProductListEditor.tsx   # Lista, ordenamiento y acciones de velas
│   │   ├── ProductFormModal.tsx    # Modal para crear/editar vela con preview visual
│   │   └── BrandContactEditor.tsx  # Textos de portada, WhatsApp y entrega
│   ├── preview/
│   │   ├── CatalogPreview.tsx           # Contenedor de páginas de revista A4
│   │   ├── CatalogCoverPage.tsx         # Portada editorial de lujo
│   │   ├── CatalogProductPage.tsx       # Páginas de productos (2 por hoja A4)
│   │   ├── CatalogBackCoverPage.tsx     # Contraportada con pedidos y contacto
│   │   ├── VisualDimensionIndicator.tsx # Diagrama visual con silueta y cotas ↕ ↔
│   │   ├── FragranceBadgeList.tsx       # Etiquetas de aromas con icono
│   │   └── ColorSwatchList.tsx          # Muestrario de colores disponibles
│   └── shared/
│       ├── HeaderNavbar.tsx        # Barra superior con selector de catálogos y status DB
│       ├── CatalogManagerModal.tsx # Gestor visual: listar, crear, clonar y borrar catálogos
│       ├── PdfExportModal.tsx      # Opciones de exportación a PDF
│       └── ShareUrlModal.tsx       # Generador de URL limpia para clientes
├── data/
│   ├── defaultCatalog.ts       # Datos iniciales y catálogo de muestra
│   └── seasonalThemes.ts       # Presets de Navidad, Amor y Amistad, Día de las Madres...
├── lib/
│   ├── db.ts                   # Pool MySQL, migraciones automáticas y repositorio CRUD
│   ├── pdfGenerator.ts         # Funciones de descarga directa PDF e impresión
│   └── storage.ts              # Persistencia local y utilidades
└── types/
    └── catalog.ts              # Definiciones TypeScript de Productos, Temas y Catálogo
```

---

## ☁️ Despliegue en Vercel

Este proyecto está 100% optimizado para desplegarse con un clic en **Vercel** o cualquier plataforma compatible con Next.js:

1. Sube tu código a GitHub.
2. Conecta el repositorio en [vercel.com](https://vercel.com).
3. ¡Listo! Tu catálogo estará en vivo con su dominio HTTPS para compartir de inmediato con tus clientes.
