import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@ile-ase/common';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PRACTITIONER_STANDARDS } from './standards';
import { StandardsService } from './standards.service';
import { SafeguardingCasesService } from './cases.service';
import { RESTRICTION_LABELS, RestrictionsService } from './restrictions.service';
import { SafeguardingAlertService } from './safeguarding-alert.service';
import { AcceptStandardsDto, AddCaseEntryDto, ApplyRestrictionDto, CreateCaseDto, UpdateCaseDto } from './dto/safeguarding.dto';

@Controller('safeguarding')
@UseGuards(JwtAuthGuard)
export class SafeguardingController {
  constructor(
    private standards: StandardsService,
    private cases: SafeguardingCasesService,
    private restrictions: RestrictionsService,
    private alerts: SafeguardingAlertService
  ) {}

  // ---- SAFE-12: practitioner and vendor standards ----

  @Public()
  @Get('standards')
  getStandards() {
    return PRACTITIONER_STANDARDS;
  }

  @Get('standards/me')
  myStandards(@CurrentUser() user: CurrentUserPayload) {
    return this.standards.status(user.id);
  }

  @Post('standards/accept')
  acceptStandards(@CurrentUser() user: CurrentUserPayload, @Body() dto: AcceptStandardsDto) {
    return this.standards.accept(user.id, dto.version);
  }

  // ---- SAFE-02: the case register (Safeguarding and Super admins only) ----

  @Get('cases')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  async listCases(@Query('status') status?: string, @Query('priority') priority?: string) {
    return { ...(await this.cases.list({ status, priority: priority ? Number(priority) : undefined })), alertsConfigured: this.alerts.isConfigured };
  }

  @Post('cases')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  createCase(@Body() dto: CreateCaseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.cases.open({ ...dto, authorId: user.id });
  }

  @Get('cases/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  getCase(@Param('id') id: string) {
    return this.cases.get(id);
  }

  @Patch('cases/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  updateCase(@Param('id') id: string, @Body() dto: UpdateCaseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.cases.update(id, dto, user.id);
  }

  @Post('cases/:id/entries')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  addEntry(@Param('id') id: string, @Body() dto: AddCaseEntryDto, @CurrentUser() user: CurrentUserPayload) {
    return this.cases.addEntry(id, dto.kind, dto.text, user.id);
  }

  @Post('alerts/test')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  async testAlert() {
    return { sent: await this.alerts.test() };
  }

  // ---- SAFE-05: narrower restrictions ----

  @Get('restrictions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  listRestrictions(@Query('userId') userId: string) {
    return this.restrictions.listFor(userId);
  }

  @Post('restrictions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  async applyRestriction(@Body() dto: ApplyRestrictionDto, @CurrentUser() user: CurrentUserPayload) {
    const r = await this.restrictions.apply({
      ...dto,
      createdById: user.id,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    if (dto.caseId) {
      await this.cases.addEntry(dto.caseId, 'MEASURE', `Restriction applied: ${RESTRICTION_LABELS[dto.type]}${dto.expiresAt ? ` until ${dto.expiresAt.slice(0, 10)}` : ''} — ${dto.reason}`, user.id);
    }
    return r;
  }

  @Post('restrictions/:id/lift')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.SAFEGUARDING, AdminSubRole.SUPER)
  async liftRestriction(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const r = await this.restrictions.lift(id, user.id);
    if (r.caseId) await this.cases.addEntry(r.caseId, 'MEASURE', `Restriction lifted: ${RESTRICTION_LABELS[r.type as keyof typeof RESTRICTION_LABELS] ?? r.type}`, user.id);
    return r;
  }
}
