/**
 * Ilé Àṣẹ Color Palette
 * Preserved from original design - culturally significant colors
 */
export const COLORS = {
  gold: '#B45309',      // --ase-gold (Oyo Gold)
  clay: '#92400E',      // --ase-clay (Clay Earth)
  ivory: '#FDFCF0',     // --ase-ivory (Ivory Sanctuary)
  forest: '#166534',    // --ase-forest (Forest Spirit)
  stone: '#292524',     // --ase-stone (Deep Midnight)
  stoneMuted: '#57534E', // --ase-stone-muted
  white: '#FFFFFF'
} as const;

export type ColorKey = keyof typeof COLORS;
