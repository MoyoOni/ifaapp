// SHOP_BACKLOG.md MSP-001: keyword search needs to match against the cultural
// taxonomy's per-subcategory notes (e.g. searching "Osun" should surface
// items in a subcategory whose note mentions Osun), not just product
// name/description. That taxonomy's source of truth is
// frontend/src/features/marketplace/marketplace-categories.ts -- this is a
// search-only mirror of its `culturalNote` values, keyed by subcategory slug.
// The taxonomy is static reference content (categories rarely change), so a
// manual mirror is preferable here to a shared runtime dependency between
// the two apps for a handful of description strings.
export const SUBCATEGORY_CULTURAL_NOTES: Record<string, string> = {
  'divination-tools': 'Opon Ifá, Ikin (palm nuts), Opele chains, Iyerosa powder',
  'beads-jewelry': 'Orisha bead sets, Ilekes (waist beads), Ildes/collares for different Orishas',
  'ritual-supplies':
    'Cascarilla (eggshell powder), spiritual herbs, roots, sacred waters, candles, incense',
  'altar-items': 'Orisha statues, soperas (ceremonial vessels), crowns, ritual tools',
  'sacred-fabrics': 'Àṣọ-ọkẹ, Adire textiles, traditional ceremonial cloths',
  'books-guides': 'Ifá texts, Yoruba language workbooks, Orisha guides, proverb collections',
  'courses-digital': 'Online Ifá lessons, Yoruba language courses, cultural workshops',
  'study-tools': 'Flashcards, Odù Ifá reference charts, prayer books',
  'childrens-materials': 'Cultural stories, coloring books, youth education kits',
  'traditional-wear':
    'Fila (Yoruba caps), Agbada robes, Iro and Buba sets, modern Yoruba-inspired fashion',
  'casual-merch': 'T-shirts with Yoruba proverbs/symbols, hoodies, tote bags',
  accessories: 'Gele (headwraps), belts, bags with Adire/Ankara patterns',
  'wall-art': 'Prints of Orishas, Yoruba symbols, cultural posters, framed proverbs',
  'sculptures-carvings': 'Traditional Yoruba art, wooden carvings, brass items',
  'home-items': 'Candles with Orisha imagery, incense holders, altar cloths, decorative bowls',
  textiles: 'Throw pillows, tapestries, rugs with traditional patterns',
  'music-media': 'Traditional Yoruba music, guided meditations, ceremonial recordings',
  'food-beverages': 'Packaged traditional snacks, Zobo mix, Kunnu, spices, recipe books',
  wellness: 'Shea butter, black soap, essential oils, spiritual baths',
  handcrafted: 'Limited edition artwork, custom beadwork by verified artisans',
  'initiation-kits': 'Curated sets for different levels of spiritual journey',
  personalized: 'Custom divination readings, named prayer items',
  'newcomer-kits': 'Introduction to Ifá/Yoruba culture packages',
  'subscription-boxes': 'Curated cultural/spiritual items delivered monthly',
  'temple-bundles': 'Supplies for congregations and ceremonies',
  ebooks: 'Downloadable study materials, prayer guides, ritual guides',
  'digital-art': 'Phone wallpapers, desktop backgrounds with cultural symbols',
  printables: 'Prayer cards, ritual guides, coloring pages',
};

/** Subcategory slugs whose cultural note text contains the search term. */
export function findSubcategoriesMatchingNote(search: string): string[] {
  const term = search.trim().toLowerCase();
  if (!term) return [];
  return Object.entries(SUBCATEGORY_CULTURAL_NOTES)
    .filter(([, note]) => note.toLowerCase().includes(term))
    .map(([slug]) => slug);
}
