import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CmsHeroSlide {
  id: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  titleLine3: string;
  subtitle: string;
  ctaText: string;
  ctaPath: string;
  desktopMediaId?: string;
  desktopImageUrl: string;
  mobileMediaId?: string;
  mobileImageUrl: string;
  imageAlt: string;
  status: 'ACTIVE' | 'INACTIVE';
  order: number;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CmsCategory {
  id: string;
  categoryId?: string; // Relation with real CatalogCategory ID
  key: string;
  title: string;
  description: string;
  ctaText: string;
  url: string;
  desktopMediaId?: string;
  desktopImageUrl: string;
  mobileMediaId?: string;
  mobileImageUrl: string;
  imageAlt: string;
  status: 'ACTIVE' | 'INACTIVE';
  order: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CmsCollection {
  id: string;
  collectionId?: string; // Relation with real CatalogCollection ID
  key: string;
  title: string;
  description: string;
  ctaText: string;
  url: string;
  mediaId?: string;
  imageUrl: string;
  imageAlt: string;
  status: 'ACTIVE' | 'INACTIVE';
  order: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CmsAdvantage {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  status: 'ACTIVE' | 'INACTIVE';
  order: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MediaItem {
  id: string; // e.g. 'MEDIA_001'
  filename: string;
  url: string;
  mimeType: string;
  sizeKb: number;
  width: number;
  height: number;
  altText: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface MediaUsageRef {
  type: 'HERO' | 'CATEGORY' | 'COLLECTION' | 'PRODUCT' | 'BANNER';
  label: string;
  id: string;
}

export type BannerType =
  | 'HERO'
  | 'PROMOTION'
  | 'COLLECTION'
  | 'COMMUNICATION'
  | 'WHATSAPP'
  | 'FIDELITE'
  | 'PROS_CLUB'
  | 'EDITORIAL'
  | 'CUSTOM';

export type BannerStatus = 'DRAFT' | 'READY' | 'SCHEDULED' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export type BannerValidationStatus = 'VALID' | 'INVALID';

export type BannerValidationReason = 'MEDIA_MISSING' | 'INVALID_WHATSAPP' | 'MISSING_ENTITY' | 'NONE';

export type BannerLocation = 'HOMEPAGE' | 'SHOP' | 'COLLECTION' | 'CATEGORY' | 'PROS_CLUB' | 'OTHER';

export interface BannerVersionHistory {
  version: string;
  publishedAt: string;
  publishedBy: string;
  notes?: string;
  snapshot: Omit<ProsBanner, 'versionHistory'>;
}

export interface ProsBanner {
  id: string;
  name: string;
  type: BannerType;
  status: BannerStatus;
  validationStatus?: BannerValidationStatus;
  validationReason?: BannerValidationReason;
  desktopMediaId?: string;
  desktopImageUrl: string;
  mobileMediaId?: string;
  mobileImageUrl?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  targetLocation: BannerLocation;
  targetEntityId?: string;
  sortOrder: number;
  startAt?: string;
  endAt?: string;
  version: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy?: string;
  versionHistory?: BannerVersionHistory[];
}

export interface HomepageCmsData {
  hero: CmsHeroSlide[];
  categories: CmsCategory[];
  collections: CmsCollection[];
  advantages: CmsAdvantage[];
}

export interface CmsVersion {
  version: string; // e.g. "v1.0", "v1.1", "v2.0"
  publishedAt: string;
  publishedBy: string;
  notes?: string;
  dataSnapshot: HomepageCmsData;
}

export interface CmsAuditLog {
  id: string;
  adminName: string;
  action: string;
  section: string;
  itemModified?: string;
  oldValue: string;
  newValue: string;
  version?: string;
  timestamp: string;
}

export interface CmsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface CmsContextType {
  publishedCms: HomepageCmsData;
  draftCms: HomepageCmsData;
  mediaLibrary: MediaItem[];
  banners: ProsBanner[];
  cmsVersions: CmsVersion[];
  cmsAuditLogs: CmsAuditLog[];
  isDraftModified: boolean;
  activeVersion: string;
  
  // CMS Edit Actions
  updateHeroSlide: (slide: CmsHeroSlide) => void;
  addHeroSlide: () => CmsHeroSlide;
  deleteHeroSlide: (id: string) => void;
  
  updateCategory: (category: CmsCategory) => void;
  updateCollection: (collection: CmsCollection) => void;
  
  updateAdvantage: (advantage: CmsAdvantage) => void;
  addAdvantage: () => CmsAdvantage;
  deleteAdvantage: (id: string) => void;
  
  // Section order & status
  toggleSlideStatus: (id: string) => void;
  toggleCategoryStatus: (id: string) => void;
  toggleCollectionStatus: (id: string) => void;
  toggleAdvantageStatus: (id: string) => void;
  
  // Banners Actions
  addBanner: (bannerData: Partial<ProsBanner>, adminName?: string) => ProsBanner;
  updateBanner: (updatedBanner: ProsBanner, adminName?: string) => void;
  replaceBannerMedia: (bannerId: string, targetType: 'desktop' | 'mobile', media: MediaItem, adminName?: string) => void;
  deleteBanner: (id: string, force?: boolean) => { success: boolean; isUsed: boolean; message?: string };
  toggleBannerStatus: (id: string, adminName?: string) => void;
  publishBanner: (id: string, adminName?: string, notes?: string) => { success: boolean; version?: string; errors?: string[] };
  restoreBannerVersion: (id: string, versionStr: string, adminName?: string) => void;

  // Draft, Validation & Publish
  saveDraft: (adminName?: string) => void;
  validateDraft: () => CmsValidationResult;
  publishCMS: (adminName?: string, notes?: string) => { success: boolean; version?: string; errors?: string[] };
  restoreVersion: (versionNumber: string, adminName?: string) => void;
  
  // Media Library Central Actions
  uploadMedia: (file: { filename: string; url: string; altText: string; sizeKb: number; format?: string; mimeType?: string; width?: number; height?: number }) => MediaItem;
  deleteMedia: (id: string, force?: boolean) => { success: boolean; isUsed: boolean; usages: MediaUsageRef[]; message?: string };
  updateMediaAlt: (id: string, newAlt: string) => void;
  getMediaUsage: (mediaId: string) => MediaUsageRef[];
}

const DEFAULT_HERO_SLIDES: CmsHeroSlide[] = [
  {
    id: 'hero-1',
    eyebrow: 'BIENVENUE CHEZ PROS',
    titleLine1: 'ÉLÉGANTE.',
    titleLine2: 'FORTE.',
    titleLine3: 'ENGAGÉE.',
    subtitle: "PLUS QU'UN NOM, UNE VISION.",
    ctaText: 'DÉCOUVRIR LA COLLECTION',
    ctaPath: '/shop',
    desktopMediaId: 'MEDIA_001',
    desktopImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
    mobileMediaId: 'MEDIA_001',
    mobileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    imageAlt: 'Mannequins PROS — Sweatshirt & Hoodie Signature',
    status: 'ACTIVE',
    order: 1,
    createdAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'hero-2',
    eyebrow: 'NOUVELLE COLLECTION 2026',
    titleLine1: 'HAUTE',
    titleLine2: 'COUTURE',
    titleLine3: 'AFRICAINE.',
    subtitle: 'LE VESTIAIRE CONTEMPORAIN DU PRÉSIDENT OUSMANE SONKO.',
    ctaText: 'EXPLORER LES NOUVEAUTÉS',
    ctaPath: '/shop',
    desktopMediaId: 'MEDIA_004',
    desktopImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
    mobileMediaId: 'MEDIA_004',
    mobileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    imageAlt: 'Collection Homme PROS Signature',
    status: 'ACTIVE',
    order: 2,
    createdAt: '2026-08-18T10:30:00.000Z',
  },
];

const DEFAULT_CATEGORIES: CmsCategory[] = [
  {
    id: 'cms-cat-1',
    categoryId: 'cat-homme',
    key: 'homme',
    title: 'HOMME',
    description: 'Sweatshirts 480GSM, Polo Piqué Luxe & Outerwear Structuré',
    ctaText: 'DÉCOUVRIR HOMME',
    url: '/shop?category=homme',
    desktopMediaId: 'MEDIA_002',
    desktopImageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
    mobileMediaId: 'MEDIA_002',
    mobileImageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Collection Homme PROS',
    status: 'ACTIVE',
    order: 1,
  },
  {
    id: 'cms-cat-2',
    categoryId: 'cat-femme',
    key: 'femme',
    title: 'FEMME',
    description: 'Hoodies Crop, Ensembles Seamless & Coupe Oversize Féminine',
    ctaText: 'DÉCOUVRIR FEMME',
    url: '/shop?category=femme',
    desktopMediaId: 'MEDIA_003',
    desktopImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    mobileMediaId: 'MEDIA_003',
    mobileImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Collection Femme PROS',
    status: 'ACTIVE',
    order: 2,
  },
  {
    id: 'cms-cat-3',
    categoryId: 'cat-accessoires',
    key: 'accessoires',
    title: 'ACCESSOIRES',
    description: 'Casquettes Structurées, Bonnets Mérinos & Tote Bags Canvas',
    ctaText: 'DÉCOUVRIR ACCESSOIRES',
    url: '/shop?category=accessoires',
    desktopImageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
    mobileImageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Accessoires PROS',
    status: 'ACTIVE',
    order: 3,
  },
];

const DEFAULT_COLLECTIONS: CmsCollection[] = [
  {
    id: 'cms-col-1',
    collectionId: 'col-essentielle',
    key: 'essentielle',
    title: 'COLLECTION ESSENTIELLE',
    description: 'Les indispensables intemporels du vestiaire PROS.',
    ctaText: 'EXPLORER',
    url: '/shop?badge=essentiel',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
    imageAlt: 'Collection Essentielle PROS',
    status: 'ACTIVE',
    order: 1,
  },
  {
    id: 'cms-col-2',
    collectionId: 'col-signature',
    key: 'signature',
    title: 'COLLECTION SIGNATURE OUSMANE SONKO',
    description: 'Pièces d’exception gravées du monogramme officiel.',
    ctaText: 'DÉCOUVRIR',
    url: '/shop?badge=bestseller',
    mediaId: 'MEDIA_004',
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
    imageAlt: 'Collection Signature PROS',
    status: 'ACTIVE',
    order: 2,
  },
];

const DEFAULT_ADVANTAGES: CmsAdvantage[] = [
  { id: 'adv-1', title: 'LIVRAISON EXPRESS SÉNÉGAL', subtitle: 'Dakar sous 24h & Régions (Thiès, St-Louis, Touba...)', iconName: 'Truck', status: 'ACTIVE', order: 1 },
  { id: 'adv-2', title: 'PAIEMENT SÉCURISÉ SEN', subtitle: 'Wave, Orange Money & Carte Bancaire', iconName: 'ShieldCheck', status: 'ACTIVE', order: 2 },
  { id: 'adv-3', title: 'QUALITÉ LUXE 480GSM', subtitle: 'Cotons biologiques ultra-denses sélectionnés', iconName: 'Award', status: 'ACTIVE', order: 3 },
  { id: 'adv-4', title: 'SERVICE CLIENT DÉDIÉ', subtitle: 'Assistance WhatsApp & Téléphone 7j/7', iconName: 'Headphones', status: 'ACTIVE', order: 4 },
];

const INITIAL_MEDIA_LIBRARY: MediaItem[] = [
  {
    id: 'MEDIA_001',
    filename: 'hero-desktop-1.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
    mimeType: 'image/jpeg',
    sizeKb: 240,
    width: 1920,
    height: 1080,
    altText: 'Hero banner desktop PROS — Sweatshirt & Hoodie Signature',
    createdAt: '2026-08-18T10:00:00.000Z',
    createdBy: 'System Seed',
  },
  {
    id: 'MEDIA_002',
    filename: 'category-homme.jpg',
    url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
    mimeType: 'image/jpeg',
    sizeKb: 180,
    width: 1000,
    height: 800,
    altText: 'Catégorie Homme PROS 480GSM',
    createdAt: '2026-08-18T10:05:00.000Z',
    createdBy: 'System Seed',
  },
  {
    id: 'MEDIA_003',
    filename: 'category-femme.jpg',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    mimeType: 'image/jpeg',
    sizeKb: 195,
    width: 1000,
    height: 800,
    altText: 'Catégorie Femme PROS Seamless',
    createdAt: '2026-08-18T10:10:00.000Z',
    createdBy: 'System Seed',
  },
  {
    id: 'MEDIA_004',
    filename: 'collection-signature.jpg',
    url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
    mimeType: 'image/jpeg',
    sizeKb: 310,
    width: 1200,
    height: 900,
    altText: 'Collection Signature Ousmane Sonko',
    createdAt: '2026-08-18T10:15:00.000Z',
    createdBy: 'System Seed',
  },
];

const DEFAULT_BANNERS: ProsBanner[] = [
  {
    id: 'banner-hero-editorial',
    name: 'Hero Editorial Slider (Homepage)',
    type: 'HERO',
    status: 'ACTIVE',
    validationStatus: 'VALID',
    validationReason: 'NONE',
    desktopMediaId: 'MEDIA_001',
    desktopImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
    mobileMediaId: 'MEDIA_001',
    mobileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    eyebrow: 'ÉLÉGANTE. FORTE. ENGAGÉE.',
    title: 'HERO EDITORIAL SLIDER',
    subtitle: 'Consultez et modifiez les visuels de la bannière principale de la boutique PROS.',
    description: 'Bannière carrousel principale configurée depuis le CMS Homepage.',
    ctaText: 'DÉCOUVRIR LA COLLECTION',
    ctaUrl: '/shop',
    targetLocation: 'HOMEPAGE',
    sortOrder: 1,
    version: '1.0',
    createdAt: '2026-08-18T10:00:00.000Z',
    createdBy: 'System Seed',
  },
  {
    id: 'banner-whatsapp-1',
    name: 'Communications WhatsApp Direct Launch 2026',
    type: 'WHATSAPP',
    status: 'ACTIVE',
    validationStatus: 'VALID',
    validationReason: 'NONE',
    desktopMediaId: 'MEDIA_001',
    desktopImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
    mobileMediaId: 'MEDIA_001',
    mobileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    eyebrow: 'COMMUNICATIONS DAKAR & SÉNÉGAL',
    title: 'COMMUNICATIONS WHATSAPP',
    subtitle: 'Assistance personnalisée et prise de commande directe 7j/7',
    description: 'Discutez directement avec un conseiller PROS sur WhatsApp pour vos commandes et conseils de taille.',
    ctaText: 'CONTACTER SUR WHATSAPP',
    ctaUrl: 'https://wa.me/221770000000',
    targetLocation: 'HOMEPAGE',
    sortOrder: 2,
    version: '1.0',
    createdAt: '2026-08-18T10:30:00.000Z',
    createdBy: 'System Seed',
  },
  {
    id: 'banner-pros-club-1',
    name: 'Programme PROS Club & Privilèges Membres',
    type: 'PROS_CLUB',
    status: 'ACTIVE',
    validationStatus: 'VALID',
    validationReason: 'NONE',
    desktopMediaId: 'MEDIA_004',
    desktopImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
    mobileMediaId: 'MEDIA_004',
    mobileImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
    eyebrow: 'PROGRAMME DE FIDÉLITÉ OFFICIEL',
    title: 'PROGRAMME PROS CLUB',
    subtitle: 'Points de fidélité et accès exclusif aux ventes privées',
    description: 'Chaque commande passée vous fait cumuler des points convertibles en remises immédiates.',
    ctaText: 'REJOINDRE LE CLUB',
    ctaUrl: '/account',
    targetLocation: 'PROS_CLUB',
    sortOrder: 3,
    version: '1.0',
    createdAt: '2026-08-18T11:00:00.000Z',
    createdBy: 'System Seed',
  },
  {
    id: 'banner-collection-sig-2026',
    name: 'Bannière Collection Signature Ousmane Sonko',
    type: 'COLLECTION',
    status: 'ACTIVE',
    validationStatus: 'VALID',
    validationReason: 'NONE',
    desktopMediaId: 'MEDIA_004',
    desktopImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80',
    mobileMediaId: 'MEDIA_004',
    mobileImageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
    eyebrow: 'SÉRIE LIMITÉE HAUTE DENSITÉ',
    title: 'COLLECTION SIGNATURE 2026',
    subtitle: 'Pièces d’exception 480GSM gravées du monogramme officiel PROS',
    description: 'Sweatshirts, Hoodies et Polos piqués de prestige fabriqués au Sénégal.',
    ctaText: 'EXPLORER LA COLLECTION',
    ctaUrl: '/shop?badge=bestseller',
    targetLocation: 'COLLECTION',
    sortOrder: 4,
    version: '1.1',
    createdAt: '2026-08-18T11:30:00.000Z',
    createdBy: 'System Seed',
  },
];

const CmsContext = createContext<CmsContextType | undefined>(undefined);

const CMS_PUBLISHED_KEY = 'pros_cms_published_v2';
const CMS_DRAFT_KEY = 'pros_cms_draft_v2';
const CMS_MEDIA_KEY = 'pros_cms_media_v2';
const CMS_BANNERS_KEY = 'pros_cms_banners_v2';
const CMS_AUDIT_KEY = 'pros_cms_audit_v2';
const CMS_VERSIONS_KEY = 'pros_cms_versions_v2';

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialData: HomepageCmsData = {
    hero: DEFAULT_HERO_SLIDES,
    categories: DEFAULT_CATEGORIES,
    collections: DEFAULT_COLLECTIONS,
    advantages: DEFAULT_ADVANTAGES,
  };

  const [publishedCms, setPublishedCms] = useState<HomepageCmsData>(() => {
    const saved = localStorage.getItem(CMS_PUBLISHED_KEY);
    return saved ? JSON.parse(saved) : initialData;
  });

  const [draftCms, setDraftCms] = useState<HomepageCmsData>(() => {
    const saved = localStorage.getItem(CMS_DRAFT_KEY);
    return saved ? JSON.parse(saved) : publishedCms;
  });

  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem(CMS_MEDIA_KEY);
    return saved ? JSON.parse(saved) : INITIAL_MEDIA_LIBRARY;
  });

  const [banners, setBanners] = useState<ProsBanner[]>(() => {
    const saved = localStorage.getItem(CMS_BANNERS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_BANNERS;
  });

  const [cmsVersions, setCmsVersions] = useState<CmsVersion[]>(() => {
    const saved = localStorage.getItem(CMS_VERSIONS_KEY);
    if (saved) return JSON.parse(saved);
    return [
      {
        version: 'v1.0',
        publishedAt: '2026-08-18T12:00:00.000Z',
        publishedBy: 'System Initial Seed',
        notes: 'Initialisation de la version 1.0 de la homepage PROS',
        dataSnapshot: initialData,
      },
    ];
  });

  const [cmsAuditLogs, setCmsAuditLogs] = useState<CmsAuditLog[]>(() => {
    const saved = localStorage.getItem(CMS_AUDIT_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [isDraftModified, setIsDraftModified] = useState(false);

  const activeVersion = cmsVersions[0]?.version || 'v1.0';

  useEffect(() => {
    localStorage.setItem(CMS_PUBLISHED_KEY, JSON.stringify(publishedCms));
  }, [publishedCms]);

  useEffect(() => {
    localStorage.setItem(CMS_DRAFT_KEY, JSON.stringify(draftCms));
  }, [draftCms]);

  useEffect(() => {
    localStorage.setItem(CMS_MEDIA_KEY, JSON.stringify(mediaLibrary));
  }, [mediaLibrary]);

  useEffect(() => {
    localStorage.setItem(CMS_BANNERS_KEY, JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem(CMS_VERSIONS_KEY, JSON.stringify(cmsVersions));
  }, [cmsVersions]);

  useEffect(() => {
    localStorage.setItem(CMS_AUDIT_KEY, JSON.stringify(cmsAuditLogs));
  }, [cmsAuditLogs]);

  // Log action
  const addAuditLog = (
    action: string,
    section: string,
    itemModified: string,
    oldValue: string,
    newValue: string,
    adminName = 'Service Pro (Admin)',
    version?: string
  ) => {
    const newLog: CmsAuditLog = {
      id: `cms-log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      adminName,
      action,
      section,
      itemModified,
      oldValue,
      newValue,
      version: version || activeVersion,
      timestamp: new Date().toLocaleString('fr-FR'),
    };
    setCmsAuditLogs((prev) => [newLog, ...prev]);
  };

  // Usage resolution
  const getMediaUsage = (mediaId: string): MediaUsageRef[] => {
    const usages: MediaUsageRef[] = [];

    // Hero slides
    draftCms.hero.forEach((slide, idx) => {
      if (slide.desktopMediaId === mediaId) {
        usages.push({ type: 'HERO', label: `Hero Slide #${idx + 1} (${slide.eyebrow}) - Desktop`, id: slide.id });
      }
      if (slide.mobileMediaId === mediaId) {
        usages.push({ type: 'HERO', label: `Hero Slide #${idx + 1} (${slide.eyebrow}) - Mobile`, id: slide.id });
      }
    });

    // Categories
    draftCms.categories.forEach((cat) => {
      if (cat.desktopMediaId === mediaId || cat.mobileMediaId === mediaId) {
        usages.push({ type: 'CATEGORY', label: `Catégorie Homepage (${cat.title})`, id: cat.id });
      }
    });

    // Collections
    draftCms.collections.forEach((col) => {
      if (col.mediaId === mediaId) {
        usages.push({ type: 'COLLECTION', label: `Collection Homepage (${col.title})`, id: col.id });
      }
    });

    // Banners
    banners.forEach((banner) => {
      if (banner.desktopMediaId === mediaId) {
        usages.push({ type: 'BANNER', label: `Bannière "${banner.name}" - Desktop`, id: banner.id });
      }
      if (banner.mobileMediaId === mediaId) {
        usages.push({ type: 'BANNER', label: `Bannière "${banner.name}" - Mobile`, id: banner.id });
      }
    });

    return usages;
  };

  // CMS Edit Actions
  const updateHeroSlide = (updatedSlide: CmsHeroSlide) => {
    const target = draftCms.hero.find((s) => s.id === updatedSlide.id);
    const itemWithTime = {
      ...updatedSlide,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin PROS',
    };

    setDraftCms((prev) => ({
      ...prev,
      hero: prev.hero.map((s) => (s.id === updatedSlide.id ? itemWithTime : s)),
    }));
    setIsDraftModified(true);

    if (target && target.desktopMediaId !== updatedSlide.desktopMediaId) {
      addAuditLog('MEDIA ASSIGNED', 'HERO', `Slide #${updatedSlide.order} Desktop`, target.desktopMediaId || '', updatedSlide.desktopMediaId || '');
    } else if (target && target.mobileMediaId !== updatedSlide.mobileMediaId) {
      addAuditLog('MEDIA ASSIGNED', 'HERO', `Slide #${updatedSlide.order} Mobile`, target.mobileMediaId || '', updatedSlide.mobileMediaId || '');
    } else {
      addAuditLog('Modification Slide Hero', 'HERO', `Slide #${updatedSlide.order}`, target?.eyebrow || '', updatedSlide.eyebrow);
    }
  };

  const addHeroSlide = (): CmsHeroSlide => {
    const newSlide: CmsHeroSlide = {
      id: `hero-${Date.now()}`,
      eyebrow: 'NOUVELLE BANNIÈRE',
      titleLine1: 'NOUVEAU',
      titleLine2: 'STYLE',
      titleLine3: 'PROS.',
      subtitle: 'DÉCOUVREZ LES DERNIÈRES CRÉATIONS DE LA MARQUE.',
      ctaText: 'VOIR LA SELECTION',
      ctaPath: '/shop',
      desktopMediaId: 'MEDIA_001',
      desktopImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
      mobileMediaId: 'MEDIA_001',
      mobileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
      imageAlt: 'Bannière PROS',
      status: 'ACTIVE',
      order: draftCms.hero.length + 1,
      createdAt: new Date().toISOString(),
    };

    setDraftCms((prev) => ({
      ...prev,
      hero: [...prev.hero, newSlide],
    }));
    setIsDraftModified(true);
    addAuditLog('Création Slide Hero', 'HERO', `Slide #${newSlide.order}`, '', newSlide.eyebrow);
    return newSlide;
  };

  const deleteHeroSlide = (id: string) => {
    const target = draftCms.hero.find((s) => s.id === id);
    setDraftCms((prev) => ({
      ...prev,
      hero: prev.hero.filter((s) => s.id !== id),
    }));
    setIsDraftModified(true);
    addAuditLog('Suppression Slide Hero', 'HERO', id, target?.eyebrow || '', 'Supprimé');
  };

  const updateCategory = (updatedCat: CmsCategory) => {
    setDraftCms((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === updatedCat.id ? { ...updatedCat, updatedAt: new Date().toISOString() } : c)),
    }));
    setIsDraftModified(true);
    addAuditLog('Modification Catégorie Homepage', 'CATÉGORIES', updatedCat.title, '', updatedCat.title);
  };

  const updateCollection = (updatedCol: CmsCollection) => {
    setDraftCms((prev) => ({
      ...prev,
      collections: prev.collections.map((c) => (c.id === updatedCol.id ? { ...updatedCol, updatedAt: new Date().toISOString() } : c)),
    }));
    setIsDraftModified(true);
    addAuditLog('Modification Collection Homepage', 'COLLECTIONS', updatedCol.title, '', updatedCol.title);
  };

  const updateAdvantage = (updatedAdv: CmsAdvantage) => {
    setDraftCms((prev) => ({
      ...prev,
      advantages: prev.advantages.map((a) => (a.id === updatedAdv.id ? { ...updatedAdv, updatedAt: new Date().toISOString() } : a)),
    }));
    setIsDraftModified(true);
    addAuditLog('Modification Avantage', 'AVANTAGES', updatedAdv.title, '', updatedAdv.title);
  };

  const addAdvantage = (): CmsAdvantage => {
    const newAdv: CmsAdvantage = {
      id: `adv-${Date.now()}`,
      title: 'NOUVEL AVANTAGE',
      subtitle: 'Description courte du service ou privilège PROS.',
      iconName: 'Truck',
      status: 'ACTIVE',
      order: draftCms.advantages.length + 1,
    };

    setDraftCms((prev) => ({
      ...prev,
      advantages: [...prev.advantages, newAdv],
    }));
    setIsDraftModified(true);
    addAuditLog('Création Avantage', 'AVANTAGES', newAdv.title, '', newAdv.title);
    return newAdv;
  };

  const deleteAdvantage = (id: string) => {
    const target = draftCms.advantages.find((a) => a.id === id);
    setDraftCms((prev) => ({
      ...prev,
      advantages: prev.advantages.filter((a) => a.id !== id),
    }));
    setIsDraftModified(true);
    addAuditLog('Suppression Avantage', 'AVANTAGES', id, target?.title || '', 'Supprimé');
  };

  // Status Toggles
  const toggleSlideStatus = (id: string) => {
    setDraftCms((prev) => ({
      ...prev,
      hero: prev.hero.map((s) => (s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', updatedAt: new Date().toISOString() } : s)),
    }));
    setIsDraftModified(true);
    addAuditLog('Changement Statut Hero', 'HERO', id, 'TOGGLE', 'Statut modifié');
  };

  const toggleCategoryStatus = (id: string) => {
    setDraftCms((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', updatedAt: new Date().toISOString() } : c)),
    }));
    setIsDraftModified(true);
    addAuditLog('Changement Statut Catégorie', 'CATÉGORIES', id, 'TOGGLE', 'Statut modifié');
  };

  const toggleCollectionStatus = (id: string) => {
    setDraftCms((prev) => ({
      ...prev,
      collections: prev.collections.map((c) => (c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', updatedAt: new Date().toISOString() } : c)),
    }));
    setIsDraftModified(true);
    addAuditLog('Changement Statut Collection', 'COLLECTIONS', id, 'TOGGLE', 'Statut modifié');
  };

  const toggleAdvantageStatus = (id: string) => {
    setDraftCms((prev) => ({
      ...prev,
      advantages: prev.advantages.map((a) => (a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', updatedAt: new Date().toISOString() } : a)),
    }));
    setIsDraftModified(true);
    addAuditLog('Changement Statut Avantage', 'AVANTAGES', id, 'TOGGLE', 'Statut modifié');
  };

  // BANNER ACTIONS
  const addBanner = (bannerData: Partial<ProsBanner>, adminName = 'Service Pro (Admin)'): ProsBanner => {
    const nextId = `banner-${Date.now()}`;
    const newBanner: ProsBanner = {
      id: nextId,
      name: bannerData.name || 'Nouvelle Bannière PROS',
      type: bannerData.type || 'PROMOTION',
      status: bannerData.status || 'DRAFT',
      validationStatus: 'VALID',
      validationReason: 'NONE',
      desktopMediaId: bannerData.desktopMediaId,
      desktopImageUrl: bannerData.desktopImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
      mobileMediaId: bannerData.mobileMediaId,
      mobileImageUrl: bannerData.mobileImageUrl || bannerData.desktopImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      eyebrow: bannerData.eyebrow || 'PROS BRAND',
      title: bannerData.title || 'NOUVELLE BANNIÈRE',
      subtitle: bannerData.subtitle,
      description: bannerData.description,
      ctaText: bannerData.ctaText || 'DÉCOUVRIR',
      ctaUrl: bannerData.ctaUrl || '/shop',
      targetLocation: bannerData.targetLocation || 'HOMEPAGE',
      targetEntityId: bannerData.targetEntityId,
      sortOrder: bannerData.sortOrder || banners.length + 1,
      startAt: bannerData.startAt,
      endAt: bannerData.endAt,
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: adminName,
    };

    setBanners((prev) => [newBanner, ...prev]);
    addAuditLog('BANNER_CREATED', 'BANNIÈRES PROS', newBanner.id, 'N/A', newBanner.name, adminName, '1.0');
    return newBanner;
  };

  const updateBanner = (updatedBanner: ProsBanner, adminName = 'Service Pro (Admin)') => {
    const target = banners.find((b) => b.id === updatedBanner.id);
    const updated: ProsBanner = {
      ...updatedBanner,
      validationStatus: 'VALID',
      validationReason: 'NONE',
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
    };

    setBanners((prev) => prev.map((b) => (b.id === updatedBanner.id ? updated : b)));
    addAuditLog('BANNER_UPDATED', 'BANNIÈRES PROS', updatedBanner.id, target?.name || '', updatedBanner.name, adminName, updatedBanner.version);
    addAuditLog('BANNER_REVALIDATED', 'BANNIÈRES PROS', updatedBanner.id, 'INVALID', 'VALID', adminName);
  };

  const replaceBannerMedia = (bannerId: string, targetType: 'desktop' | 'mobile', media: MediaItem, adminName = 'Service Pro (Admin)') => {
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === bannerId) {
          const oldMediaId = targetType === 'desktop' ? b.desktopMediaId : b.mobileMediaId;
          const updated: ProsBanner = {
            ...b,
            desktopMediaId: targetType === 'desktop' ? media.id : b.desktopMediaId,
            desktopImageUrl: targetType === 'desktop' ? media.url : b.desktopImageUrl,
            mobileMediaId: targetType === 'mobile' ? media.id : b.mobileMediaId,
            mobileImageUrl: targetType === 'mobile' ? media.url : b.mobileImageUrl,
            validationStatus: 'VALID',
            validationReason: 'NONE',
            updatedAt: new Date().toISOString(),
            updatedBy: adminName,
          };

          addAuditLog('MEDIA_REPLACED', 'BANNIÈRES PROS', bannerId, oldMediaId || 'N/A', media.id, adminName);
          addAuditLog('BANNER_REVALIDATED', 'BANNIÈRES PROS', bannerId, 'INVALID', 'VALID', adminName);
          return updated;
        }
        return b;
      })
    );
  };

  const deleteBanner = (id: string, force = false): { success: boolean; isUsed: boolean; message?: string } => {
    const target = banners.find((b) => b.id === id);
    if (!target) return { success: false, isUsed: false, message: 'Bannière introuvable.' };

    if (target.status === 'ACTIVE' && !force) {
      return {
        success: false,
        isUsed: true,
        message: `La bannière "${target.name}" est actuellement ACTIVE et affichée publiquement. Veuillez d'abord la désactiver ou confirmer la suppression.`,
      };
    }

    setBanners((prev) => prev.filter((b) => b.id !== id));
    addAuditLog('BANNER_DELETED', 'BANNIÈRES PROS', id, target.name, 'Supprimée');
    return { success: true, isUsed: false };
  };

  const toggleBannerStatus = (id: string, adminName = 'Service Pro (Admin)') => {
    const target = banners.find((b) => b.id === id);
    if (!target) return;

    const nextStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: adminName } : b))
    );
    addAuditLog(
      nextStatus === 'ACTIVE' ? 'BANNER_ENABLED' : 'BANNER_DISABLED',
      'BANNIÈRES PROS',
      id,
      target.status,
      nextStatus,
      adminName
    );
  };

  const publishBanner = (id: string, adminName = 'Service Pro (Admin)', notes = 'Mise en ligne bannière'): { success: boolean; version?: string; errors?: string[] } => {
    const target = banners.find((b) => b.id === id);
    if (!target) return { success: false, errors: ['Bannière introuvable.'] };

    const majorMinor = (target.version || '1.0').split('.');
    const nextMinor = parseInt(majorMinor[1] || '0', 10) + 1;
    const newVersion = `${majorMinor[0] || '1'}.${nextMinor}`;

    const snapshot: Omit<ProsBanner, 'versionHistory'> = JSON.parse(JSON.stringify(target));
    const versionEntry: BannerVersionHistory = {
      version: newVersion,
      publishedAt: new Date().toISOString(),
      publishedBy: adminName,
      notes,
      snapshot,
    };

    const updated: ProsBanner = {
      ...target,
      status: 'ACTIVE',
      validationStatus: 'VALID',
      validationReason: 'NONE',
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
      versionHistory: [versionEntry, ...(target.versionHistory || [])],
    };

    setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
    addAuditLog('BANNER_PUBLISHED', 'BANNIÈRES PROS', id, target.version, newVersion, adminName, newVersion);
    return { success: true, version: newVersion };
  };

  const restoreBannerVersion = (id: string, versionStr: string, adminName = 'Service Pro (Admin)') => {
    const target = banners.find((b) => b.id === id);
    if (!target || !target.versionHistory) return;

    const histEntry = target.versionHistory.find((v) => v.version === versionStr);
    if (!histEntry) return;

    const majorMinor = (target.version || '1.0').split('.');
    const nextMinor = parseInt(majorMinor[1] || '0', 10) + 1;
    const newVersion = `${majorMinor[0] || '1'}.${nextMinor}`;

    const newSnapshot: Omit<ProsBanner, 'versionHistory'> = JSON.parse(JSON.stringify(histEntry.snapshot));
    const newVersionEntry: BannerVersionHistory = {
      version: newVersion,
      publishedAt: new Date().toISOString(),
      publishedBy: adminName,
      notes: `Restauration de la version v${versionStr}`,
      snapshot: newSnapshot,
    };

    const restored: ProsBanner = {
      ...histEntry.snapshot,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName,
      versionHistory: [newVersionEntry, ...target.versionHistory],
    };

    setBanners((prev) => prev.map((b) => (b.id === id ? restored : b)));
    addAuditLog('BANNER_VERSION_RESTORED', 'BANNIÈRES PROS', id, `v${target.version}`, `v${newVersion} (restaurée depuis v${versionStr})`, adminName, newVersion);
  };

  // Validation Engine
  const validateDraft = (): CmsValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Hero slides check
    const activeHero = draftCms.hero.filter((s) => s.status === 'ACTIVE');
    if (activeHero.length === 0) {
      errors.push('Au moins une slide Hero doit être configurée comme ACTIVE.');
    }

    draftCms.hero.forEach((slide, idx) => {
      if (!slide.ctaText.trim()) errors.push(`Slide Hero #${idx + 1}: Le texte du bouton CTA est obligatoire.`);
      if (!slide.ctaPath.trim()) errors.push(`Slide Hero #${idx + 1}: L'URL cible CTA est obligatoire.`);
      if (!slide.desktopImageUrl.trim() && !slide.desktopMediaId) errors.push(`Slide Hero #${idx + 1}: L'image Desktop est obligatoire.`);
      if (!slide.imageAlt.trim()) warnings.push(`Slide Hero #${idx + 1}: Le texte ALT SEO est conseillé.`);
    });

    // 2. Categories check
    draftCms.categories.forEach((cat) => {
      if (cat.status === 'ACTIVE' && (!cat.desktopImageUrl || !cat.url)) {
        errors.push(`Catégorie "${cat.title}": URL et image requis pour l'affichage.`);
      }
    });

    // 3. Collections check
    draftCms.collections.forEach((col) => {
      if (col.status === 'ACTIVE' && (!col.imageUrl || !col.url)) {
        errors.push(`Collection "${col.title}": URL et image requis pour l'affichage.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  // Draft & Publish
  const saveDraft = (adminName = 'Service Pro (Admin)') => {
    localStorage.setItem(CMS_DRAFT_KEY, JSON.stringify(draftCms));
    setIsDraftModified(false);
    addAuditLog('Sauvegarde Brouillon', 'CMS HOMEPAGE', 'Draft JSON', 'Sauvegardé', 'Brouillon à jour', adminName);
  };

  const publishCMS = (adminName = 'Service Pro (Admin)', notes = 'Mise en ligne standard des modifications homepage'): { success: boolean; version?: string; errors?: string[] } => {
    const validation = validateDraft();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const currentVerStr = cmsVersions[0]?.version || 'v1.0';
    const majorMinor = currentVerStr.replace('v', '').split('.');
    const nextMinor = (parseInt(majorMinor[1] || '0', 10) + 1);
    const newVersion = `v${majorMinor[0] || '1'}.${nextMinor}`;

    const newVersionEntry: CmsVersion = {
      version: newVersion,
      publishedAt: new Date().toISOString(),
      publishedBy: adminName,
      notes,
      dataSnapshot: JSON.parse(JSON.stringify(draftCms)),
    };

    setCmsVersions((prev) => [newVersionEntry, ...prev]);
    setPublishedCms(draftCms);
    setIsDraftModified(false);

    addAuditLog('Publication En Ligne', 'HOMEPAGE PUBLIQUE', 'Version Live', currentVerStr, newVersion, adminName, newVersion);

    return {
      success: true,
      version: newVersion,
    };
  };

  // Version Restoration / Rollback
  const restoreVersion = (versionNumber: string, adminName = 'Service Pro (Admin)') => {
    const target = cmsVersions.find((v) => v.version === versionNumber);
    if (!target) return;

    const restoredData = JSON.parse(JSON.stringify(target.dataSnapshot));
    setDraftCms(restoredData);
    setPublishedCms(restoredData);
    setIsDraftModified(false);

    addAuditLog('Restauration de Version', 'VERSIONS CMS', `Version ${versionNumber}`, activeVersion, versionNumber, adminName, versionNumber);
  };

  // Media Library Central Actions
  const uploadMedia = (file: { filename: string; url: string; altText: string; sizeKb: number; format?: string; mimeType?: string; width?: number; height?: number }): MediaItem => {
    const nextIdNum = mediaLibrary.length + 1;
    const mediaId = `MEDIA_${String(nextIdNum).padStart(3, '0')}`;

    const newItem: MediaItem = {
      id: mediaId,
      filename: file.filename,
      url: file.url,
      mimeType: file.mimeType || `image/${(file.format || 'jpeg').toLowerCase()}`,
      sizeKb: file.sizeKb,
      width: file.width || 1920,
      height: file.height || 1080,
      altText: file.altText || file.filename,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin PROS',
    };

    setMediaLibrary((prev) => [newItem, ...prev]);
    addAuditLog('MEDIA UPLOAD', 'MÉDIATHÈQUE PROS', newItem.id, 'N/A', newItem.filename);
    return newItem;
  };

  const deleteMedia = (id: string, force = false): { success: boolean; isUsed: boolean; usages: MediaUsageRef[]; message?: string } => {
    const usages = getMediaUsage(id);
    if (usages.length > 0 && !force) {
      return {
        success: false,
        isUsed: true,
        usages,
        message: `Impossible de supprimer : ce média (${id}) est actuellement utilisé par ${usages.length} composant(s) de la plateforme PROS.`,
      };
    }

    const target = mediaLibrary.find((m) => m.id === id);
    setMediaLibrary((prev) => prev.filter((m) => m.id !== id));

    // Automatically invalidate banners referencing this media ID
    setBanners((prev) =>
      prev.map((b) => {
        if (b.desktopMediaId === id || b.mobileMediaId === id) {
          addAuditLog('MEDIA_MISSING_DETECTED', 'BANNIÈRES PROS', b.id, id, 'Média supprimé - Bannière invalidée');
          addAuditLog('BANNER_INVALIDATED', 'BANNIÈRES PROS', b.id, b.status, 'INACTIVE (MÉDIA MANQUANT)');
          return {
            ...b,
            validationStatus: 'INVALID',
            validationReason: 'MEDIA_MISSING',
            status: b.status === 'ACTIVE' ? 'INACTIVE' : b.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      })
    );

    addAuditLog('MEDIA DELETE', 'MÉDIATHÈQUE PROS', id, target?.filename || '', 'Supprimé');
    return { success: true, isUsed: false, usages: [] };
  };

  const updateMediaAlt = (id: string, newAlt: string) => {
    const target = mediaLibrary.find((m) => m.id === id);
    setMediaLibrary((prev) =>
      prev.map((m) => (m.id === id ? { ...m, altText: newAlt, updatedAt: new Date().toISOString() } : m))
    );
    addAuditLog('MEDIA ALT UPDATED', 'MÉDIATHÈQUE PROS', id, target?.altText || '', newAlt);
  };

  return (
    <CmsContext.Provider
      value={{
        publishedCms,
        draftCms,
        mediaLibrary,
        banners,
        cmsVersions,
        cmsAuditLogs,
        isDraftModified,
        activeVersion,
        updateHeroSlide,
        addHeroSlide,
        deleteHeroSlide,
        updateCategory,
        updateCollection,
        updateAdvantage,
        addAdvantage,
        deleteAdvantage,
        toggleSlideStatus,
        toggleCategoryStatus,
        toggleCollectionStatus,
        toggleAdvantageStatus,
        addBanner,
        updateBanner,
        replaceBannerMedia,
        deleteBanner,
        toggleBannerStatus,
        publishBanner,
        restoreBannerVersion,
        saveDraft,
        validateDraft,
        publishCMS,
        restoreVersion,
        uploadMedia,
        deleteMedia,
        updateMediaAlt,
        getMediaUsage,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
