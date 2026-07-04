import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Shared "fetch parent -> check status -> check conflict -> create" scaffold
 * (P3-06). `academy.service.ts#createEnrollment` and
 * `tutors.service.ts#createTutorSession` independently implemented this exact
 * sequence with slightly different exception messages; this extracts the
 * common contract while leaving each service's actual Prisma queries (which
 * differ per model) in place.
 */
export interface EligibilityScaffoldParams<TParent, TResult> {
  fetchParent: () => Promise<TParent | null>;
  parentNotFoundMessage: string;
  validateStatus: (parent: TParent) => boolean;
  invalidStatusMessage: string;
  checkConflict: (parent: TParent) => Promise<boolean>;
  conflictMessage: string;
  create: (parent: TParent) => Promise<TResult>;
}

export async function verifyEligibilityCheckConflictAndCreate<TParent, TResult>(
  params: EligibilityScaffoldParams<TParent, TResult>
): Promise<TResult> {
  const parent = await params.fetchParent();

  if (!parent) {
    throw new NotFoundException(params.parentNotFoundMessage);
  }

  if (!params.validateStatus(parent)) {
    throw new BadRequestException(params.invalidStatusMessage);
  }

  const hasConflict = await params.checkConflict(parent);
  if (hasConflict) {
    throw new BadRequestException(params.conflictMessage);
  }

  return params.create(parent);
}
