/**
 * Cultural Level Enumeration
 * Represents progression in Isese/Ifá knowledge and practice
 * NOTE: Preserves Yoruba diacritics and cultural terminology
 */
export enum CulturalLevel {
  OMO_ILE = 'Omo Ilé',      // Child of the House
  AKEKO = 'Akeko',          // Dedicated Student
  OYE = 'Oye',              // Titled Initiate
  AREMO = 'Aremo',          // Crown Prince
  OMO_AWO = 'Omo Awo'       // Child of the Priest
}

export type CulturalLevelType = keyof typeof CulturalLevel;
