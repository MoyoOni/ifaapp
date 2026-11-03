import { RestrictionsService } from '../../src/safeguarding/restrictions.service';
import { StandardsService } from '../../src/safeguarding/standards.service';
import { SafeguardingCasesService } from '../../src/safeguarding/cases.service';

/**
 * Permissive safeguarding stand-ins for unit tests of services that check
 * restrictions, practitioner standards or open cases: nobody is restricted,
 * everyone has accepted, and cases open quietly. Tests of those rules
 * themselves override the relevant method.
 */
export const mockRestrictions = () => ({
  has: jest.fn().mockResolvedValue(false),
  assertNot: jest.fn().mockResolvedValue(undefined),
  userIdsUnder: jest.fn().mockResolvedValue([]),
  noContactBetween: jest.fn().mockResolvedValue(false),
  assertContactAllowed: jest.fn().mockResolvedValue(undefined),
});

export const mockStandards = () => ({
  assertAccepted: jest.fn().mockResolvedValue(undefined),
  status: jest.fn().mockResolvedValue({ required: false, accepted: true }),
});

export const mockCases = () => ({
  openQuietly: jest.fn().mockResolvedValue(null),
  recordSourceOutcome: jest.fn().mockResolvedValue(undefined),
});

export const safeguardingMockProviders = () => [
  { provide: RestrictionsService, useValue: mockRestrictions() },
  { provide: StandardsService, useValue: mockStandards() },
  { provide: SafeguardingCasesService, useValue: mockCases() },
];
