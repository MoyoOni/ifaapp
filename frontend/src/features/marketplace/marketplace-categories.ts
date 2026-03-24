export interface MarketplaceSubcategory {
  slug: string;
  label: string;
  culturalNote?: string;
}

export interface MarketplaceCategory {
  slug: string;
  label: string;
  icon: string;
  color: string;         // Tailwind classes for badge/chip
  bgClass: string;       // Tailwind bg for category header
  subcategories: MarketplaceSubcategory[];
  requiresVerification?: boolean; // Shows "Verified Vendor" note
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    slug: 'sacred-ritual',
    label: 'Sacred & Ritual Items',
    icon: '🔮',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    bgClass: 'from-amber-500/10 to-amber-500/5',
    requiresVerification: true,
    subcategories: [
      { slug: 'divination-tools', label: 'Divination Tools', culturalNote: 'Opon Ifá, Ikin (palm nuts), Opele chains, Iyerosa powder' },
      { slug: 'beads-jewelry', label: 'Beads & Jewelry', culturalNote: 'Orisha bead sets, Ilekes (waist beads), Ildes/collares for different Orishas' },
      { slug: 'ritual-supplies', label: 'Ritual Supplies', culturalNote: 'Cascarilla (eggshell powder), spiritual herbs, roots, sacred waters, candles, incense' },
      { slug: 'altar-items', label: 'Altar Items', culturalNote: 'Orisha statues, soperas (ceremonial vessels), crowns, ritual tools' },
      { slug: 'sacred-fabrics', label: 'Sacred Fabrics', culturalNote: 'Àṣọ-ọkẹ, Adire textiles, traditional ceremonial cloths' },
    ],
  },
  {
    slug: 'education',
    label: 'Educational & Learning',
    icon: '📚',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    bgClass: 'from-blue-500/10 to-blue-500/5',
    subcategories: [
      { slug: 'books-guides', label: 'Books & Study Guides', culturalNote: 'Ifá texts, Yoruba language workbooks, Orisha guides, proverb collections' },
      { slug: 'courses-digital', label: 'Courses & Digital Content', culturalNote: 'Online Ifá lessons, Yoruba language courses, cultural workshops' },
      { slug: 'study-tools', label: 'Study Tools', culturalNote: 'Flashcards, Odù Ifá reference charts, prayer books' },
      { slug: 'childrens-materials', label: "Children's Materials", culturalNote: 'Cultural stories, coloring books, youth education kits' },
    ],
  },
  {
    slug: 'apparel',
    label: 'Apparel & Fashion',
    icon: '👕',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    bgClass: 'from-purple-500/10 to-purple-500/5',
    subcategories: [
      { slug: 'traditional-wear', label: 'Traditional Wear', culturalNote: 'Fila (Yoruba caps), Agbada robes, Iro and Buba sets, modern Yoruba-inspired fashion' },
      { slug: 'casual-merch', label: 'Casual Merchandise', culturalNote: 'T-shirts with Yoruba proverbs/symbols, hoodies, tote bags' },
      { slug: 'accessories', label: 'Accessories', culturalNote: 'Gele (headwraps), belts, bags with Adire/Ankara patterns' },
    ],
  },
  {
    slug: 'art-decor',
    label: 'Art & Home Decor',
    icon: '🎨',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    bgClass: 'from-rose-500/10 to-rose-500/5',
    subcategories: [
      { slug: 'wall-art', label: 'Wall Art', culturalNote: 'Prints of Orishas, Yoruba symbols, cultural posters, framed proverbs' },
      { slug: 'sculptures-carvings', label: 'Sculptures & Carvings', culturalNote: 'Traditional Yoruba art, wooden carvings, brass items' },
      { slug: 'home-items', label: 'Home Items', culturalNote: 'Candles with Orisha imagery, incense holders, altar cloths, decorative bowls' },
      { slug: 'textiles', label: 'Textiles', culturalNote: 'Throw pillows, tapestries, rugs with traditional patterns' },
    ],
  },
  {
    slug: 'cultural-lifestyle',
    label: 'Cultural & Lifestyle',
    icon: '🎵',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    bgClass: 'from-green-500/10 to-green-500/5',
    subcategories: [
      { slug: 'music-media', label: 'Music & Media', culturalNote: 'Traditional Yoruba music, guided meditations, ceremonial recordings' },
      { slug: 'food-beverages', label: 'Food & Beverages', culturalNote: 'Packaged traditional snacks, Zobo mix, Kunnu, spices, recipe books' },
      { slug: 'wellness', label: 'Wellness Products', culturalNote: 'Shea butter, black soap, essential oils, spiritual baths' },
    ],
  },
  {
    slug: 'premium-collector',
    label: 'Premium & Collector',
    icon: '💎',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    bgClass: 'from-indigo-500/10 to-indigo-500/5',
    requiresVerification: true,
    subcategories: [
      { slug: 'handcrafted', label: 'Handcrafted Pieces', culturalNote: 'Limited edition artwork, custom beadwork by verified artisans' },
      { slug: 'initiation-kits', label: 'Initiation Kits', culturalNote: 'Curated sets for different levels of spiritual journey' },
      { slug: 'personalized', label: 'Personalized Items', culturalNote: 'Custom divination readings, named prayer items' },
    ],
  },
  {
    slug: 'gift-bundles',
    label: 'Gift Sets & Bundles',
    icon: '🎁',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    bgClass: 'from-orange-500/10 to-orange-500/5',
    subcategories: [
      { slug: 'newcomer-kits', label: 'Newcomer Kits', culturalNote: 'Introduction to Ifá/Yoruba culture packages' },
      { slug: 'subscription-boxes', label: 'Monthly Subscription Boxes', culturalNote: 'Curated cultural/spiritual items delivered monthly' },
      { slug: 'temple-bundles', label: 'Temple Bundles', culturalNote: 'Supplies for congregations and ceremonies' },
    ],
  },
  {
    slug: 'digital',
    label: 'Digital Products',
    icon: '💡',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    bgClass: 'from-cyan-500/10 to-cyan-500/5',
    subcategories: [
      { slug: 'ebooks', label: 'E-books & Guides', culturalNote: 'Downloadable study materials, prayer guides, ritual guides' },
      { slug: 'digital-art', label: 'Digital Art', culturalNote: 'Phone wallpapers, desktop backgrounds with cultural symbols' },
      { slug: 'printables', label: 'Printable Resources', culturalNote: 'Prayer cards, ritual guides, coloring pages' },
    ],
  },
];

export const getCategoryBySlug = (slug: string): MarketplaceCategory | undefined =>
  MARKETPLACE_CATEGORIES.find(c => c.slug === slug);

export const getSubcategoryLabel = (categorySlug: string, subSlug: string): string => {
  const cat = getCategoryBySlug(categorySlug);
  return cat?.subcategories.find(s => s.slug === subSlug)?.label ?? subSlug;
};

export const ALL_SUBCATEGORIES = MARKETPLACE_CATEGORIES.flatMap(cat =>
  cat.subcategories.map(sub => ({ ...sub, categorySlug: cat.slug, categoryLabel: cat.label }))
);
