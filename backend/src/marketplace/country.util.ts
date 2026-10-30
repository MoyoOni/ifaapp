// SHOP_BACKLOG.md MSP-009: checkout's country field is free text, so
// "Nigeria", "NG", "nigeria " and "Naija" must all count as the same place
// when deciding whether an order crosses a border.
const ALIASES: Record<string, string> = {
  ng: 'nigeria',
  nga: 'nigeria',
  naija: 'nigeria',
  'federal republic of nigeria': 'nigeria',
  uk: 'united kingdom',
  gb: 'united kingdom',
  gbr: 'united kingdom',
  'great britain': 'united kingdom',
  england: 'united kingdom',
  scotland: 'united kingdom',
  wales: 'united kingdom',
  us: 'united states',
  usa: 'united states',
  'united states of america': 'united states',
  america: 'united states',
  gh: 'ghana',
  bj: 'benin',
  'republic of benin': 'benin',
  br: 'brazil',
  brasil: 'brazil',
  cu: 'cuba',
  ca: 'canada',
};

export function normalizeCountry(country: string | null | undefined): string {
  const key = (country ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return ALIASES[key] ?? key;
}

/** An order is international when it leaves the vendor's country. */
export function isInternationalShipment(
  destination: string | null | undefined,
  shipsFrom: string | null | undefined
): boolean {
  const to = normalizeCountry(destination);
  if (!to) return false; // no destination given (e.g. digital-only order)
  return to !== normalizeCountry(shipsFrom || 'Nigeria');
}
