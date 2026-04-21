import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, RolePermission, Permission, UserRole } from '@prisma/client';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    this.logger.log('Retrieving all available permissions');
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Assign a permission to a user role
   */
  async assignPermissionToRole(role: UserRole, permissionName: string): Promise<RolePermission> {
    this.logger.log(`Assigning permission ${permissionName} to role ${role}`);

    // Verify the permission exists
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {
      throw new BadRequestException(`Permission ${permissionName} does not exist`);
    }

    // Create the role-permission assignment
    const rolePermission = await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: role,
        permissionId: permission.id
      }
    });

    this.logger.log(`Permission ${permissionName} assigned to role ${role}`);
    return rolePermission;
  }

  /**
   * Remove a permission from a user role
   */
  async removePermissionFromRole(role: UserRole, permissionName: string): Promise<void> {
    this.logger.log(`Removing permission ${permissionName} from role ${role}`);

    // Find the permission
    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {
      throw new BadRequestException(`Permission ${permissionName} does not exist`);
    }

    // Delete the role-permission assignment
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: role,
        permissionId: permission.id
      }
    });

    this.logger.log(`Permission ${permissionName} removed from role ${role}`);
  }

  /**
   * Check if a user has a specific permission
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    this.logger.log(`Checking if user ${userId} has permission ${permissionName}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    // Check if the user has the specific permission directly or via role
    const hasPermission = user.rolePermissions.some(
      rp => rp.permission.name === permissionName
    );

    return hasPermission;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    this.logger.log(`Retrieving permissions for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    // Get permissions from user's role
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: user.role },
      include: { permission: true }
    });

    // Combine role-based permissions with user-specific permissions
    const allPermissions = [
      ...user.rolePermissions.map(rp => rp.permission),
      ...rolePermissions.map(rp => rp.permission)
    ];

    // Remove duplicates
    const uniquePermissions = Array.from(
      new Set(allPermissions.map(p => p.id))
    ).map(id => allPermissions.find(p => p.id === id));

    return uniquePermissions;
  }

  /**
   * Grant a specific permission to a user (beyond their role)
   */
  async grantUserPermission(userId: string, permissionName: string): Promise<RolePermission> {
    this.logger.log(`Granting permission ${permissionName} to user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {
      throw new BadRequestException(`Permission ${permissionName} does not exist`);
    }

    // Grant the permission to the user
    const userPermission = await this.prisma.rolePermission.create({
      data: {
        userId: userId,
        permissionId: permission.id
      }
    });

    this.logger.log(`Permission ${permissionName} granted to user ${userId}`);
    return userPermission;
  }

  /**
   * Revoke a specific permission from a user
   */
  async revokeUserPermission(userId: string, permissionName: string): Promise<void> {
    this.logger.log(`Revoking permission ${permissionName} from user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName }
    });

    if (!permission) {
      throw new BadRequestException(`Permission ${permissionName} does not exist`);
    }

    // Revoke the permission from the user
    await this.prisma.rolePermission.deleteMany({
      where: {
        userId: userId,
        permissionId: permission.id
      }
    });

    this.logger.log(`Permission ${permissionName} revoked from user ${userId}`);
  }

  /**
   * Create a new permission
   */
  async createPermission(name: string, description: string): Promise<Permission> {
    this.logger.log(`Creating new permission: ${name}`);

    try {
      const permission = await this.prisma.permission.create({
        data: {
          name,
          description
        }
      });

      this.logger.log(`Permission ${name} created successfully`);
      return permission;
    } catch (error) {
      if (error.code === 'P2002') { // Unique constraint violation
        throw new BadRequestException(`Permission ${name} already exists`);
      }
      throw error;
    }
  }

  /**
   * Get all users with a specific permission
   */
  async getUsersWithPermission(permissionName: string): Promise<User[]> {
    this.logger.log(`Retrieving all users with permission: ${permissionName}`);

    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
      include: {
        rolePermissions: {
          include: {
            user: true
          }
        }
      }
    });

    if (!permission) {
      throw new BadRequestException(`Permission ${permissionName} does not exist`);
    }

    // Get users who have this permission either directly or via role
    const users = permission.rolePermissions
      .filter(rp => rp.user !== null) // Only include users (not just role associations)
      .map(rp => rp.user);

    return users;
  }
}