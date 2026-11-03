import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PRACTITIONER_STANDARDS } from './standards';

/** docs/safeguarding SAFE-12: who must accept, and whether they have. */
export const ROLES_BOUND_BY_STANDARDS = ['BABALAWO', 'VENDOR'];

@Injectable()
export class StandardsService {
  constructor(private prisma: PrismaService) {}

  async status(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, standardsVersionAccepted: true, standardsAcceptedAt: true },
    });
    return {
      version: PRACTITIONER_STANDARDS.version,
      required: !!user && ROLES_BOUND_BY_STANDARDS.includes(user.role),
      accepted: user?.standardsVersionAccepted === PRACTITIONER_STANDARDS.version,
      acceptedAt: user?.standardsVersionAccepted === PRACTITIONER_STANDARDS.version ? user.standardsAcceptedAt : null,
    };
  }

  async accept(userId: string, version: string) {
    // Accepting an older text than the one shown now would record the wrong thing.
    if (version !== PRACTITIONER_STANDARDS.version) {
      throw new ForbiddenException('These standards have been updated. Please read the current version and accept again.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { standardsVersionAccepted: version, standardsAcceptedAt: new Date() },
    });
    return this.status(userId);
  }

  /** Practitioners and vendors offer nothing until they have accepted the current standards. */
  async assertAccepted(userId: string): Promise<void> {
    const s = await this.status(userId);
    if (s.required && !s.accepted) {
      throw new ForbiddenException('Please read and accept the Ìlú Àṣẹ Practitioner and Vendor Standards first.');
    }
  }
}
