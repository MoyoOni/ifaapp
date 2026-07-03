import { Module } from '@nestjs/common';
import { LegalPolicyService } from './legal-policy.service';
import { LegalPolicyController } from './legal-policy.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LegalPolicyController],
  providers: [LegalPolicyService, PrismaService],
  exports: [LegalPolicyService],
})
export class LegalModule {}