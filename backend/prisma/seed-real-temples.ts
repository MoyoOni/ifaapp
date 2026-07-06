/**
 * Real Temple Seed — 199 Ilé Ìjúbà / Ilé Ifá congregations
 * Source: Official Ilé Ìjúbà / Ilé Ifá Directory
 *
 * Safe to re-run: uses upsert keyed on slug — skips existing entries.
 * All temples inserted with founderId: null (claimable by leaders later).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip Yoruba diacritics and produce a URL-safe slug segment */
function toSlugSegment(str: string): string {
  return str
    .replace(/[ẹẸ]/g, 'e')
    .replace(/[ọỌ]/g, 'o')
    .replace(/[ṣṢ]/g, 's')
    .replace(/[àáâãäåÀÁÂÃÄÅ]/g, 'a')
    .replace(/[èéêëÈÉÊË]/g, 'e')
    .replace(/[ìíîïÌÍÎÏ]/g, 'i')
    .replace(/[òóôõöÒÓÔÕÖ]/g, 'o')
    .replace(/[ùúûüÙÚÛÜ]/g, 'u')
    .replace(/[ýÝ]/g, 'y')
    .replace(/[ñÑ]/g, 'n')
    .replace(/[ḅḄ]/g, 'b')
    .replace(/[ṃṂ]/g, 'm')
    .replace(/[ḍḌ]/g, 'd')
    .replace(/[ṭṬ]/g, 't')
    .replace(/[^a-z0-9\s-]/gi, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function makeSlug(name: string, city: string, index: number): string {
  return `${toSlugSegment(name)}-${toSlugSegment(city)}-${index}`;
}

// ---------------------------------------------------------------------------
// Temple data — parsed from the official Ilé Ìjúbà / Ilé Ifá Directory
// ---------------------------------------------------------------------------

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  eventbrite?: string;
  leadPriest?: string;
  registrationNumber?: string;
}

interface TempleEntry {
  name: string;
  city: string;
  state: string;
  country: string;
  address: string;
  worshipDay: 'Sunday' | 'Saturday';
  // Enrichment fields (optional — for verified/prominent temples)
  website?: string;
  email?: string;
  phone?: string;
  verified?: boolean;
  description?: string;
  socialLinks?: SocialLinks;
}

const REAL_TEMPLES: TempleEntry[] = [
  // ── OGUN STATE ──────────────────────────────────────────────────────────
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: '39, Hospital Road, Offin, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: 'Ajégúnlẹ Street, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: 'Ògúnnubi Street, via Wesley School, Soyindo, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: '5, Eri Street, Makun, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: 'G2/13, Ogunbase Street, Epe, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: '2, Surulere Road, Ijagba, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìliṣàn-Rémọ', state: 'Ogun', country: 'Nigeria', address: '5, Igborule Street, Ìliṣàn-Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ogere-Rémọ', state: 'Ogun', country: 'Nigeria', address: 'Oke-Ela Magbonran Road, Ogere-Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ogere-Rémọ', state: 'Ogun', country: 'Nigeria', address: '50, Abẹòkúta Road, Ogere-Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ikenne-Rémọ', state: 'Ogun', country: 'Nigeria', address: '2, Ita Òṣùgbó Square, Ikenne-Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Damolapa compound, Ijemo, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Itoko Road, Ọbáfẹmi, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: '2, Akanbi Folarin Street, Idi-Isin, Odeda, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Dewale Adekunle Street, Oloruntedo, Obantoko, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Gbagura, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Òtà', state: 'Ogun', country: 'Nigeria', address: '35, Iganmode Road, Òtà', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Okun Owa-Ìjẹbú', state: 'Ogun', country: 'Nigeria', address: '114, Owa Road, Okun Owa, Ìjẹbú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Ishiwo', state: 'Ogun', country: 'Nigeria', address: 'Otunba Street, Igboku, Ishiwo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Ososa', state: 'Ogun', country: 'Nigeria', address: 'Itanrin Idogi Road, Ìjẹbú-Ososa', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Ososa', state: 'Ogun', country: 'Nigeria', address: '37, Gbagede Street, Ìjẹbú-Ososa', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Owu Ikija-Ìjẹbú', state: 'Ogun', country: 'Nigeria', address: 'Togunmaga Quarters, Owu Ikija, Ìjẹbú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Òde', state: 'Ogun', country: 'Nigeria', address: '34, Wasinmi Street, Ìjẹbú-Òde', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Òde', state: 'Ogun', country: 'Nigeria', address: '2, Ramona Raji Street, Ìjẹbú-Òde', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Odogbolu', state: 'Ogun', country: 'Nigeria', address: 'Tani Quarters, Odogbolu', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ago-Iwoye', state: 'Ogun', country: 'Nigeria', address: '58, Koroko Street, Oke-Odo, Ago Iwoye', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Imagbon', state: 'Ogun', country: 'Nigeria', address: 'Imagbon, Ìjẹbú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abule-Oke', state: 'Ogun', country: 'Nigeria', address: 'Ayesan Street, Abule-Oke', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Igbó', state: 'Ogun', country: 'Nigeria', address: 'Japara Street, Ìjẹbú-Igbó', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Imodi', state: 'Ogun', country: 'Nigeria', address: 'Water Works Road, Imodi', worshipDay: 'Sunday' },
  { name: 'Ijo Adimula Otito-Nífá', city: 'Owódé', state: 'Ogun', country: 'Nigeria', address: 'Aloja Street, Idi-Ota, Ado-Odo Road, Owode', worshipDay: 'Sunday' },
  { name: 'Ìjọ Àdìmúlà', city: 'Oja Odan', state: 'Ogun', country: 'Nigeria', address: 'Igbó-Ogbe, Oja Odan, Yewa', worshipDay: 'Sunday' },
  { name: 'Ìjọ Àdìmúlà', city: 'Ilaro', state: 'Ogun', country: 'Nigeria', address: 'Yewa South Local Govt, Ilaro', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Iperu-Rémọ', state: 'Ogun', country: 'Nigeria', address: 'Opposite Salvation Army, Iperu-Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ode-Rémọ', state: 'Ogun', country: 'Nigeria', address: '3, Itun Igbodo Street, Obaruwa, Ode-Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Ato Compound, Off Somorin Bus-Stop, Obantoko, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Akaka-Rémọ', state: 'Ogun', country: 'Nigeria', address: 'Akaka-Remo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ilara-Rémọ', state: 'Ogun', country: 'Nigeria', address: 'Ilara-Remo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Oru-Ìjẹbú', state: 'Ogun', country: 'Nigeria', address: 'Jaloye Quarters, Oru-Ìjẹbú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ogijo', state: 'Ogun', country: 'Nigeria', address: 'Agbowa Ogijo, Baskets Bus-Stop, Ogijo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Iyana Cele Oniyanrin, Off Agbeloba Bus-Stop, Abẹòkúta', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Aserifa Compound, Itoko, Abẹòkúta', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Ifo', state: 'Ogun', country: 'Nigeria', address: 'Opposite Ifo Local Govt, Ifo', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà', city: 'Owódé Ijako', state: 'Ogun', country: 'Nigeria', address: '3, Adekunle Toriola Street Off Agoro Rd, Owode Ijako', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Imala', state: 'Ogun', country: 'Nigeria', address: 'Baase Compound off Elega Bus-Stop, Imala, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà', city: 'Ijemo', state: 'Ogun', country: 'Nigeria', address: '150, Oke Ijemo, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Oke Aregba', state: 'Ogun', country: 'Nigeria', address: 'Abere Ifa House, Oke Odo Labaiwa, Oke Aregba, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà', city: 'Òtà', state: 'Ogun', country: 'Nigeria', address: '4, Kehinde Akintunde Street, Òtà', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Ibafo', state: 'Ogun', country: 'Nigeria', address: 'Ebipeju Road, Ibafo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Ifo', state: 'Ogun', country: 'Nigeria', address: '8, Aboyade Street, Kajola Orile, Ifo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Ifámodúpẹ', city: 'Òkè Oko', state: 'Ogun', country: 'Nigeria', address: 'Agbado adiyan gasline, ijeja, Oke-Oko', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ogijo', state: 'Ogun', country: 'Nigeria', address: 'Ààfin Ọba Gbadamosi, Beside Ogijo Police Station, Ogijo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Sango Ota', state: 'Ogun', country: 'Nigeria', address: 'Beside Arinu Palace, Navy Quarters, Sango Ota', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Agooba', state: 'Ogun', country: 'Nigeria', address: 'Old BBHS Road, Agooba', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Anipupo Compound, Ojogboro, Ilugun, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Asero', state: 'Ogun', country: 'Nigeria', address: 'Opposite Baale House, Ikopa Titun, Asero', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: '2 Òwónrín Elejigbo Temple, Obantoko, Abẹòkúta', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ọbáfẹmi Owódé', state: 'Ogun', country: 'Nigeria', address: 'Baba Patẹwọ House, Kobape', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Adífágbọlá House Ilé-Ise Awo, Idi Ori', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abẹòkúta', state: 'Ogun', country: 'Nigeria', address: 'Baba Onífá House, Bode Olude', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Odogbolu', state: 'Ogun', country: 'Nigeria', address: 'Federal Road, Ifaleke Tomikere Street, Odogbolu', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Imosan Ìjẹbú', state: 'Ogun', country: 'Nigeria', address: 'Òkè Ọjà Street, Imosan Ijebu', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Odogbolu', state: 'Ogun', country: 'Nigeria', address: 'Ikosa Road, Ogba Tami, Odogbolu', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú Òde', state: 'Ogun', country: 'Nigeria', address: 'Ọlọrunfemi Oshiga Street, Ìjẹbú Òde', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú Òde', state: 'Ogun', country: 'Nigeria', address: 'Odogi Street Off Italapo Street, Ìjẹbú Òde', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Igbó', state: 'Ogun', country: 'Nigeria', address: 'Owode-Onirin, Japara, Ìjẹbú Igbó', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìjẹbú-Igbó', state: 'Ogun', country: 'Nigeria', address: 'Òkè Agbo, Off Atan Road, Ìjẹbú Igbó', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣàgámù', state: 'Ogun', country: 'Nigeria', address: '138, Onijagba Street, Isale Ijagba, Ṣàgámù', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ode-Rémọ', state: 'Ogun', country: 'Nigeria', address: '7, Otunuga Street, Ode Rémọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Isara-Rémọ', state: 'Ogun', country: 'Nigeria', address: 'Orile Housing Estate, Behind Ilédì Òṣùgbó, Isara Rémọ', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ayépe-Ìjẹbú', state: 'Ogun', country: 'Nigeria', address: 'Aiyepe Ìjẹbú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ipara-Rémọ', state: 'Ogun', country: 'Nigeria', address: 'Community Road, Beside Ipara Club House, Ipara Rémọ', worshipDay: 'Sunday' },

  // ── LAGOS STATE ──────────────────────────────────────────────────────────
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Èbúté-Méta', state: 'Lagos', country: 'Nigeria', address: '90, Freeman Street, Èbúté-Méta Òyìngbò', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Lagos-Island', state: 'Lagos', country: 'Nigeria', address: '6, Idumagbo Avenue, Lagos Island', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Mushin', state: 'Lagos', country: 'Nigeria', address: '25, Itire Road, Mushin, Lagos', worshipDay: 'Sunday', description: 'IOA Mushin Parish — managed by the Lagos Regional Council. Reachable via Somolu Parish coordination.', socialLinks: { facebook: 'Ijo Orunmila Adulawo Worldwide' } },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Agbowa-Ikosi', state: 'Lagos', country: 'Nigeria', address: '2, Obatedo Street, Agbowa-Ikosi', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ṣómólú', state: 'Lagos', country: 'Nigeria', address: '96, Apata Street, off Oguntolu Street, Ṣómólú, Lagos', worshipDay: 'Sunday', phone: '+234 813 014 3617', description: 'Solution Temple — IOA Somolu Parish. One of the major hubs in Lagos, over 55 years in operation. Coordination point for Lagos region parishes.', socialLinks: { leadPriest: 'Odofin Adesegun Adetayo', facebook: 'Ijo Orunmila Adulawo Worldwide' } },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìkòròdú', state: 'Lagos', country: 'Nigeria', address: 'Gbadamosi Street, Itupate, Ìkòròdú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìkòròdú', state: 'Lagos', country: 'Nigeria', address: 'Abudu Street, Ìdí Ìrókò Bus-Stop Poromosan, Ìkòròdú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìkòròdú', state: 'Lagos', country: 'Nigeria', address: '6, Fákunmoju Street, Off Etunrenren, Ìkòròdú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìkòròdú', state: 'Lagos', country: 'Nigeria', address: '19, Itun Olójà Street Isiu, Ìkòròdú', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', address: '15, Odu-Oroja Crescent, Meiran Palace, Meiran', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Alákùkọ', state: 'Lagos', country: 'Nigeria', address: '100, Baálẹ Animasaun Road, Dalemo Bus-Stop, Alákùkọ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ẹpẹ', state: 'Lagos', country: 'Nigeria', address: 'Odo Ajogun, Ìjẹbú-Òde Expressway, Ẹpẹ', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Agbowa', state: 'Lagos', country: 'Nigeria', address: 'Off NNPC Filling Station, Along Agbowa-Ikosi Road, Agbowa', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Alágbàdo', state: 'Lagos', country: 'Nigeria', address: 'Àjínde Ayọ Street, Off Suberu Oje Casso Bus-Stop, Alágbàdo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Lékkì', state: 'Lagos', country: 'Nigeria', address: 'Beach Front Estate Orchid Road, Eleganza, Lékkì', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ayobo', state: 'Lagos', country: 'Nigeria', address: 'Igbeti Street, Araokanmi Bus-Stop, Ayetoro, Itele Ayobo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìkòròdú', state: 'Lagos', country: 'Nigeria', address: 'Egbin, Ijede, Ìkòròdú', worshipDay: 'Sunday' },

  // ── OYO STATE ────────────────────────────────────────────────────────────
  { name: 'Ilé Ifá Ògúndá Méjì (Agbala Ifá)', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Apata, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Òṣẹ Méjì', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Ọjà Ọba Axis, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Adúláwọ Olórìṣà Parapọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Apete, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ìmọlẹ Olódùmarè', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Alade, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà (Ìsẹsẹ Parapọ)', city: 'Ìsàlẹ Òyó', state: 'Oyo', country: 'Nigeria', address: 'Ajalaruru, Isálẹ Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ọba Ẹdú', city: 'Ìsàlẹ Òyó', state: 'Oyo', country: 'Nigeria', address: 'Isálẹ Òyó, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ìsẹsẹ Parapọ', city: 'Bara', state: 'Oyo', country: 'Nigeria', address: 'Bara, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ifádiwúrà', city: 'Isalu Ìsẹyín', state: 'Oyo', country: 'Nigeria', address: 'Isalu Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ifájenbola', city: 'Itan Ìsẹyín', state: 'Oyo', country: 'Nigeria', address: 'Itan Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Òdí Méjì', city: 'Atoori Ìsẹyín', state: 'Oyo', country: 'Nigeria', address: 'Atoori Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ogbè Atẹ', city: 'Òkè-Aro Ìsẹyín', state: 'Oyo', country: 'Nigeria', address: 'Òkè-Aro Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ifásìndé', city: 'Ìsẹyín', state: 'Oyo', country: 'Nigeria', address: 'Ladogan Òkè-Eyin, Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ifádola', city: 'Kòso', state: 'Oyo', country: 'Nigeria', address: 'Kòso, Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Òwónrín Aṣẹyìn', city: 'Ìsẹyín', state: 'Oyo', country: 'Nigeria', address: 'Ìsẹyín', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ogbè-Gbàràdá', city: 'Lanlate', state: 'Oyo', country: 'Nigeria', address: 'Isale Togun Axis, Lanlate', worshipDay: 'Saturday' },
  { name: 'Ìjọ Agbanilà', city: 'Igbó-Ora', state: 'Oyo', country: 'Nigeria', address: 'Idofin Axis, Igbó-Ora', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Atáyéṣe', city: 'Ayete', state: 'Oyo', country: 'Nigeria', address: 'Ayete', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Afinimọnà', city: 'Igangan', state: 'Oyo', country: 'Nigeria', address: 'Asunnara Road, Igangan', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Kisi', state: 'Oyo', country: 'Nigeria', address: 'Kòso Axis, Kisi', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òtúrá-Rerá', city: 'Kisi', state: 'Oyo', country: 'Nigeria', address: 'Ajagba Axis, Kisi', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ògbómòṣó', state: 'Oyo', country: 'Nigeria', address: 'Ọjà Igbo Area, Ògbómòṣó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ògbómòṣó', state: 'Oyo', country: 'Nigeria', address: 'Layonu Axis, Masifa, Ògbómòṣó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ìmọlẹ Olódùmarè', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Aládé Axis, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Adúláwọ Olórìṣà Parapọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Àdàbà Axis, Apete, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Atáyéṣe', city: 'Oko', state: 'Oyo', country: 'Nigeria', address: 'Oko, Surulere LGA', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Igboho', state: 'Oyo', country: 'Nigeria', address: 'Igboho, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Mọdáképé', state: 'Oyo', country: 'Nigeria', address: 'Mọdáképé, Igboho, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Igbope', state: 'Oyo', country: 'Nigeria', address: 'Igbope, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Igbeti', state: 'Oyo', country: 'Nigeria', address: 'Igbeti, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ogbooro', state: 'Oyo', country: 'Nigeria', address: 'Ogbooro, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ije-Owode', state: 'Oyo', country: 'Nigeria', address: 'Ije-Owode, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Sepeteri', state: 'Oyo', country: 'Nigeria', address: 'Sepeteri, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Seki', state: 'Oyo', country: 'Nigeria', address: 'Seki, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Agbonle', state: 'Oyo', country: 'Nigeria', address: 'Agbonle, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Tede', state: 'Oyo', country: 'Nigeria', address: 'Tede, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Sango Axis, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Omi-Adio, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Saki', state: 'Oyo', country: 'Nigeria', address: 'Ago-Amodu, Saki East LGA', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà (Ogbè Alárá)', city: 'Ago-Are', state: 'Oyo', country: 'Nigeria', address: 'Ago-Are, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Àpapọ Odù', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Ìbàdàn, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Ifákáyéjo', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Olodo, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Isòwò Ọpẹ Ọmọ Irúnmọlẹ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Amuloko, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Kojo Olodo, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Olunloyo, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Babanla, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ìràwọ', state: 'Oyo', country: 'Nigeria', address: 'Ìràwọ, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Òrúnmìlà Afinimọnà', city: 'Ofiki', state: 'Oyo', country: 'Nigeria', address: 'Ofiki, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Sepeteri', state: 'Oyo', country: 'Nigeria', address: 'Sepeteri, Saki East, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Ìbàdàn', state: 'Oyo', country: 'Nigeria', address: 'Ikereku, Ìbàdàn', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Kòso', state: 'Oyo', country: 'Nigeria', address: 'Kòso, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Mógàjí', state: 'Oyo', country: 'Nigeria', address: 'Mógàjí, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Kòso', state: 'Oyo', country: 'Nigeria', address: 'Kòso, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Okeho', state: 'Oyo', country: 'Nigeria', address: 'Okeho, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Oje Owode', state: 'Oyo', country: 'Nigeria', address: 'Oje-Owode, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Igboho', state: 'Oyo', country: 'Nigeria', address: 'Obaago, Igboho, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Igboho', state: 'Oyo', country: 'Nigeria', address: 'Bonni, Igboho, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Olórìsà Parapọ', city: 'Igboho', state: 'Oyo', country: 'Nigeria', address: 'Jakuta Igboho, Òyó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ẹlésìnifá Irúnmọlẹ Parapọ', city: 'Iware', state: 'Oyo', country: 'Nigeria', address: 'Iware, Surulere LGA', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ẹlésìnifá Irúnmọlẹ Parapọ', city: 'Ògbómòṣó', state: 'Oyo', country: 'Nigeria', address: 'Oke Ijeru, Ògbómòṣó', worshipDay: 'Saturday' },

  // ── OSUN STATE ───────────────────────────────────────────────────────────
  { name: 'Ilé Ifá Agbáyé', city: 'Ilé-Ifẹ', state: 'Osun', country: 'Nigeria', address: 'Òkè Ìtasẹ, Ilé-Ifẹ', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà 1', city: 'Èjìgbò', state: 'Osun', country: 'Nigeria', address: 'Òkè-Ọla Axis, Ola Èjìgbò LGA', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà 2', city: 'Èjìgbò', state: 'Osun', country: 'Nigeria', address: "B'Ọlọrunduro Òkè-Ọla Axis, Èjìgbò LGA", worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Masifa', city: 'Èjìgbò', state: 'Osun', country: 'Nigeria', address: 'Èjìgbò LGA', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Ìdin-Ìlẹkẹ', city: 'Òṣogbo', state: 'Osun', country: 'Nigeria', address: 'Atelẹwó Axis, Òṣogbo', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Òkànràn-Onílé', city: 'Òṣogbo', state: 'Osun', country: 'Nigeria', address: 'Òṣogbo', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà', city: 'Ejigbo', state: 'Osun', country: 'Nigeria', address: 'Isoko, Èjìgbò LGA', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà', city: 'Iwo', state: 'Osun', country: 'Nigeria', address: 'Ìwó', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà (Ogbèyónu)', city: 'Ilé-Ogbo', state: 'Osun', country: 'Nigeria', address: 'Ilé-Ogbo, Ayedire LGA', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ìsẹṣe Aṣẹgun', city: 'Èjìgbò', state: 'Osun', country: 'Nigeria', address: 'Èjìgbò', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Orí-Adé', city: 'Telemu', state: 'Osun', country: 'Nigeria', address: 'Telemu', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà (Ejigbo)', city: 'Ògbágbá', state: 'Osun', country: 'Nigeria', address: 'Ògbágbá', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ìwòrì Ojẹawùsá', city: 'Ìrágbìji', state: 'Osun', country: 'Nigeria', address: 'Ìrágbìji', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ogbè Alárá', city: 'Okinni', state: 'Osun', country: 'Nigeria', address: 'Aigbe, Okinni', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ọbandade', city: 'Okinni', state: 'Osun', country: 'Nigeria', address: 'Okinni', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Ìrosùn Àwòyè', city: 'Ilobu', state: 'Osun', country: 'Nigeria', address: 'Ilobu', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà Ifáloláyé', city: 'Ede', state: 'Osun', country: 'Nigeria', address: 'Agbooko Axis, Ede', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ifá Redeemer', city: 'Èjìgbò', state: 'Osun', country: 'Nigeria', address: 'Ọla Road, Èjìgbò', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ẹsìn Ifá Àdìmúlà', city: 'Arárọmí-Iwata', state: 'Osun', country: 'Nigeria', address: 'Arárọmí-Iwata Èjìgbò LGA', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ẹsìn Ifá Àdìmúlà (Òbàrà Otúa)', city: 'Isundunrin', state: 'Osun', country: 'Nigeria', address: 'Isundunrin, Èjìgbò', worshipDay: 'Saturday' },
  { name: 'Ìjọ Ẹsìn Ifá Àdìmúlà', city: 'Ifẹ-Òdàn', state: 'Osun', country: 'Nigeria', address: 'Ifẹ-Òdàn, Èjìgbò LGA', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Ògúndá Méjì', city: 'Ilesha', state: 'Osun', country: 'Nigeria', address: 'Ilesha', worshipDay: 'Sunday' },
  { name: 'Ilé Ìjọsìn Ifá Atóríṣe', city: 'Ìkòyí', state: 'Osun', country: 'Nigeria', address: 'Ìkòyí', worshipDay: 'Saturday' },
  { name: 'Adédayọ Ifágbenle Memorial', city: 'Ìlá Òràngún', state: 'Osun', country: 'Nigeria', address: 'Ìlá-Òràngún', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Ifálolóòtó', city: 'Moringbere', state: 'Osun', country: 'Nigeria', address: 'Moringbere, Ìkirè', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Ogbèhunle', city: 'Amukuku', state: 'Osun', country: 'Nigeria', address: 'Amukuku, Ìkirè', worshipDay: 'Saturday' },
  { name: 'Ilé Ifá Ògúndákẹtẹ', city: 'Èjìgbò', state: 'Osun', country: 'Nigeria', address: 'Èjìgbò', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà (Òwónrín-Sogbè)', city: 'Ika Òràngún', state: 'Osun', country: 'Nigeria', address: 'Ika Òràngún, Èjìgbò', worshipDay: 'Saturday' },
  { name: 'Ìjọ Àdìmúlà (Èjì-Ẹlémẹrẹ)', city: 'Ọbatẹdó', state: 'Osun', country: 'Nigeria', address: 'Ọbatẹdó Ọla, Èjìgbò', worshipDay: 'Saturday' },

  // ── EKITI STATE ──────────────────────────────────────────────────────────
  { name: 'Ilé Ifá Ògúndá Ròsùn', city: 'Ìlawẹ', state: 'Ekiti', country: 'Nigeria', address: 'Ìlawẹ, Èkìtì', worshipDay: 'Saturday' },

  // ── ONDO STATE ───────────────────────────────────────────────────────────
  { name: 'Ilé Ijúbà Ògúnda Meji', city: 'Ode Irele', state: 'Ondo', country: 'Nigeria', address: 'Ode Irele', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ (Ìwòrí Òṣá)', city: 'Àkúrẹ', state: 'Ondo', country: 'Nigeria', address: 'Ijomu Street Òkè Ìjẹbú Rd, Àkúrẹ', worshipDay: 'Sunday' },

  // ── REPUBLIC DU BENIN ────────────────────────────────────────────────────
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Cotonou', state: 'Littoral', country: 'Benin', address: 'C/480-481, Jericho, Cotonou', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Porto-Novo', state: 'Oueme', country: 'Benin', address: 'Porto-Novo', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Abomey-Calavi', state: 'Atlantique', country: 'Benin', address: 'Tokpa-Zoungou, Abomey-Calavi', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òrúnmìlà Adúláwọ', city: 'Ouidah', state: 'Atlantique', country: 'Benin', address: 'Maison Agassou, Ouidah', worshipDay: 'Sunday' },

  // ── USA ──────────────────────────────────────────────────────────────────
  { name: 'Assembly of Traditionals & Òrìṣà Worshippers', city: 'Exton', state: 'Pennsylvania', country: 'USA', address: 'P.O BOX 1059, Exton PA 19341', worshipDay: 'Sunday' },
  { name: 'Ìjọ Òtítọ nífá', city: 'Brooklyn', state: 'New York', country: 'USA', address: '1393 Flatbush Avenue, Brooklyn, NY', worshipDay: 'Sunday' },
  { name: 'The 256 Ifá Temple', city: 'Brooklyn', state: 'New York', country: 'USA', address: '177, Quincy Street, Brooklyn, NY', worshipDay: 'Sunday' },

  // ── UK ───────────────────────────────────────────────────────────────────
  { name: 'Ilé Ifá Òṣá Òkànràn', city: 'Croydon', state: 'London', country: 'UK', address: 'Croydon, London', worshipDay: 'Sunday' },

  // ── PROMINENT VERIFIED TEMPLES (with official websites / registrations) ──

  // IOA National Headquarters — parent body for all IOA branches worldwide
  {
    name: 'Ìjọ Òrúnmìlà Adúláwọ National HQ',
    city: 'Abẹòkúta',
    state: 'Ogun',
    country: 'Nigeria',
    address: '1, Ijo Orunmila Street, Agbeloba, Abẹòkúta, Ogun State',
    worshipDay: 'Sunday',
    website: 'https://ijoorunmilaadulawo.com',
    email: 'info@ijoorunmilaadulawo.com',
    verified: true,
    description: 'National Headquarters and governing body of Ijo Orunmila Adulawo worldwide. Oversees all IOA parishes across Nigeria and the diaspora. Incorporated Trustees — CAC/IT/NO 446.',
    socialLinks: {
      facebook: 'Ijo Orunmila Adulawo Worldwide',
      youtube: 'Ijo Orunmila Adulawo National',
      leadPriest: 'Supreme Leader Chief Ifagbemi Ifajobi',
      registrationNumber: 'CAC/IT/NO 446',
    },
  },

  // Ifadiwura Temple UK — officially registered UK company
  {
    name: 'Ifadiwura Temple UK',
    city: 'London',
    state: 'London',
    country: 'UK',
    address: '26 Lorn Road, London, SW9 0AD',
    worshipDay: 'Sunday',
    website: 'https://ifadiwuratempleukituk.org',
    email: 'ifadiwuratempleuk@gmail.com',
    verified: true,
    description: 'Officially registered Ifá temple in London, UK. IFADIWURA TEMPLE UK LIMITED (Company No. 14261437). Hosting regular ceremonies, workshops, and events in the UK Ifá community.',
    socialLinks: {
      instagram: '@ifadiwuratempleuk',
      eventbrite: 'Ifadiwura Temple UK Events',
      registrationNumber: 'Company No. 14261437',
    },
  },

  // The 256 Ifá Temple — Lagos branch (independent, has own website)
  {
    name: 'The 256 Ifá Temple',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    address: 'Lekki / Ajah, Lagos, Nigeria',
    worshipDay: 'Sunday',
    website: 'https://the256ifa.com',
    email: 'admin@the256ifa.com',
    verified: true,
    description: 'Contemporary Ifá temple based in Lagos with a strong digital presence. Known for online education, consultations, and community building.',
    socialLinks: {
      instagram: '@the256ifatemple',
      youtube: 'The 256 Ifá Temple',
    },
  },

  // Ijo Orunmila Ogbe Alara — independent Abeokuta temple
  {
    name: 'Ìjọ Òrúnmìlà Ogbè Alárá',
    city: 'Abẹòkúta',
    state: 'Ogun',
    country: 'Nigeria',
    address: 'Abeokuta, Ogun State',
    worshipDay: 'Sunday',
    phone: '+234 803 381 0540',
    description: 'Independent Ifá congregation in Abeokuta known for cultural preservation and digital outreach. Active on Facebook and YouTube.',
    socialLinks: {
      facebook: 'Ogbe Alara Ifa Temple',
      youtube: 'Ifa Quotes & Tales',
      leadPriest: 'Oluwo Ifagbemi Adewale',
    },
  },

  // Ile Ifa Agbaye — Odogbolu (with UK branch in Croydon)
  {
    name: 'Ile Ifa Agbaye',
    city: 'Odogbolu',
    state: 'Ogun',
    country: 'Nigeria',
    address: 'Odogbolu, Ogun State',
    worshipDay: 'Sunday',
    description: 'International Ifá institution with branches in Nigeria (Odogbolu) and the UK (Croydon, London). Active diaspora community.',
    socialLinks: {
      facebook: 'Ile Ifa Agbaye Official',
      instagram: '@ileifaagbaye',
      leadPriest: 'Oluwo Ifasola Ifamapami',
    },
  },

  // IOA USA Region — Pennsylvania and New York
  {
    name: 'Ìjọ Òrúnmìlà Adúláwọ USA Region',
    city: 'Philadelphia',
    state: 'Pennsylvania',
    country: 'USA',
    address: 'Pennsylvania and New York, USA',
    worshipDay: 'Sunday',
    email: 'ioausa@gmail.com',
    description: 'US regional coordination body for Ijo Orunmila Adulawo, serving the diaspora community across Pennsylvania and New York.',
    socialLinks: {
      facebook: 'Ijo Orunmila Adulawo USA',
      instagram: '@ioa_usa',
      leadPriest: 'Oluwo Ifabunmi',
    },
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🛕  Importing ${REAL_TEMPLES.length} real temples into database...\n`);

  // Build slugs — track used ones to ensure uniqueness
  const slugCounts: Record<string, number> = {};
  let created = 0;
  let skipped = 0;

  for (const temple of REAL_TEMPLES) {
    const base = `${toSlugSegment(temple.name)}-${toSlugSegment(temple.city)}`;
    slugCounts[base] = (slugCounts[base] || 0) + 1;
    const slug = `${base}-${slugCounts[base]}`;

    // Auto-enrich all IOA branch entries with the national website
    const isIOABranch = (temple.name.includes('Adúláwọ') || temple.name.includes('Adulawo'))
      && !temple.name.includes('National HQ')
      && !temple.name.includes('USA Region');
    const finalWebsite = temple.website ?? (isIOABranch ? 'https://ijoorunmilaadulawo.com' : undefined);
    const finalDescription = temple.description ?? (isIOABranch
      ? 'Parish of Ijo Orunmila Adulawo (IOA). For queries contact the National HQ: info@ijoorunmilaadulawo.com or visit ijoorunmilaadulawo.com.'
      : undefined);
    const isVerified = temple.verified ?? false;
    // These entries all come from the official Ilé Ìjúbà / Ilé Ifá Directory, not
    // an unvetted user submission, so they're ACTIVE (visible) regardless of the
    // `verified` flag. `verified` is a separate "extra-confirmed" badge shown in
    // the UI, not a visibility gate — PENDING_VERIFICATION is for temples a user
    // submits through the app, which do need admin review before going live.
    const finalStatus = 'ACTIVE';

    try {
      const existing = await prisma.temple.findUnique({ where: { slug } });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.temple.create({
        data: {
          name: temple.name,
          slug,
          city: temple.city,
          state: temple.state,
          country: temple.country,
          address: temple.address,
          worshipDay: temple.worshipDay,
          website: finalWebsite,
          email: temple.email,
          phone: temple.phone,
          description: finalDescription,
          socialLinks: temple.socialLinks ?? undefined,
          type: 'ILE_IFA',
          status: finalStatus,
          verified: isVerified,
          verifiedAt: isVerified ? new Date() : undefined,
          founderId: null,
          images: [],
          specialties: [],
        },
      });

      created++;
      if (created % 20 === 0) {
        console.log(`  ✓ ${created} created so far...`);
      }
    } catch (err) {
      console.error(`  ✗ Failed on "${temple.name}" (${temple.city}):`, err);
    }
  }

  console.log(`\n✅  Done!`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped} (already existed)`);
  console.log(`   Total   : ${REAL_TEMPLES.length}\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
