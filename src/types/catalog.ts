export type SeasonKey = 
  | 'navidad' 
  | 'amor_amistad' 
  | 'madres' 
  | 'baby_shower'
  | 'graduaciones'
  | 'eventos_religiosos'
  | 'otono' 
  | 'minimalista' 
  | 'personalizado';

export interface CandleColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  currency: string;
  description: string;
  heightCm: number;
  widthCm: number;
  fragrances: string[];
  colors: CandleColor[];
  includes?: string[];
  image: string;
  burnTimeHours?: number;
  waxType?: string;
  isSeasonalSpecial?: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export interface ThemeConfig {
  season: SeasonKey;
  palette: ThemeColors;
  fontFamily: 'editorial' | 'serif' | 'modern';
  coverLayout: 'minimal-editorial' | 'botanical-split' | 'lux-framed';
  productGridStyle: 'classic-editorial' | 'modern-magazine' | 'compact-cards';
  showDimensionsVisual: boolean;
  showFragrances: boolean;
  showColorSwatches: boolean;
  showIncludes?: boolean;
  currencySymbol: string;
}

export interface CustomSocialLink {
  id: string;
  name: string;
  url: string;
}

export interface ContactInfo {
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  pinterest?: string;
  website?: string;
  customSocials?: CustomSocialLink[];
  location?: string;
  deliveryNotes?: string;
}

export interface Catalog {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  seasonTag: string;
  editionYear: string;
  brandName: string;
  brandLogo?: string;
  coverImage: string;
  introText: string;
  featuredSectionTitle?: string;
  regularSectionTitle?: string;
  footerText?: string;
  products: Product[];
  theme: ThemeConfig;
  contact: ContactInfo;
  userId?: number;
  updatedAt: string;
}
