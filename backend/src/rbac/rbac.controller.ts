import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  private readonly logger = new Logger(RbacController.name);

  constructor(private readonly rbacService: RbacService) {}

  /**
   * Get all available permissions
   */
  @Get('permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllPermissions() {
    this.logger.log('Admin requesting all permissions');
    return this.rbacService.getAllPermissions();
  }

  /**
   * Create a new permission
   */
  @Post('permission')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Body('name') name: string,
    @Body('description') description: string
  ) {
    this.logger.log(`Admin creating new permission: ${name}`);
    return this.rbacService.createPermission(name, description);
  }

  /**
   * Assign a permission to a role
   */
  @Post('role/:role/permission/:permissionName')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async assignPermissionToRole(
    @Param('role') role: string,
    @Param('permissionName') permissionName: string
  ) {
    this.logger.log(`Admin assigning permission ${permissionName} to role ${role}`);
    
    // Validate the role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return { error: `Invalid role. Valid roles: ${validRoles.join(', ')}` };
    }
    
    return this.rbacService.assignPermissionToRole(role as UserRole, permissionName);
  }

  /**
   * Remove a permission from a role
   */
  @Delete('role/:role/permission/:permissionName')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async removePermissionFromRole(
    @Param('role') role: string,
    @Param('permissionName') permissionName: string
  ) {
    this.logger.log(`Admin removing permission ${permissionName} from role ${role}`);
    
    // Validate the role
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(role as UserRole)) {
      return { error: `Invalid role. Valid roles: ${validRoles.join(', ')}` };
    }
    
    return this.rbacService.removePermissionFromRole(role as UserRole, permissionName);
  }

  /**
   * Grant a permission to a specific user
   */
  @Post('user/:userId/permission/:permissionName')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async grantUserPermission(
    @Param('userId') userId: string,
    @Param('permissionName') permissionName: string
  ) {
    this.logger.log(`Admin granting permission ${permissionName} to user ${userId}`);
    return this.rbacService.grantUserPermission(userId, permissionName);
  }

  /**
   * Revoke a permission from a specific user
   */
  @Delete('user/:userId/permission/:permissionName')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async revokeUserPermission(
    @Param('userId') userId: string,
    @Param('permissionName') permissionName: string
  ) {
    this.logger.log(`Admin revoking permission ${permissionName} from user ${userId}`);
    return this.rbacService.revokeUserPermission(userId, permissionName);
  }

  /**
   * Check if a user has a specific permission
   */
  @Get('user/:userId/permission/:permissionName')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async checkUserPermission(
    @Param('userId') userId: string,
    @Param('permissionName') permissionName: string
  ) {
    this.logger.log(`Admin checking if user ${userId} has permission ${permissionName}`);
    const hasPermission = await this.rbacService.userHasPermission(userId, permissionName);
    return { userId, permissionName, hasPermission };
  }

  /**
   * Get current user's permissions
   */
  @Get('my-permissions')
  @HttpCode(HttpStatus.OK)
  async getCurrentUserPermissions(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} requesting their permissions`);
    return this.rbacService.getUserPermissions(user.id);
  }

  /**
   * Get all users with a specific permission
   */
  @Get('permission/:permissionName/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getUsersWithPermission(@Param('permissionName') permissionName: string) {
    this.logger.log(`Admin requesting users with permission: ${permissionName}`);
    return this.rbacService.getUsersWithPermission(permissionName);
  }
}