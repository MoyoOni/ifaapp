import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUserPayload } from '@/auth/decorators/current-user.decorator';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll(query?: any) {
    const { page = 1, limit = 10, ...filters } = query || {};
    const skip = (page - 1) * limit;

    return await this.prisma.user.findMany({
      where: filters,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  // ProBacklog-v1.md item #12 (soft-delete audit): this method has no
  // callers anywhere in the codebase today (UserService is only injected by
  // auth.service.ts and impersonation.service.ts, both of which only call
  // findById) -- but it hard-deletes a User by id with zero ownership/role
  // check, so anyone who ever wires it up to a route gets an unauthenticated
  // delete-any-user endpoint by default. Adding the guard now, before it's
  // reachable, rather than waiting for it to be found the hard way. Not
  // converted to soft-delete: user removal already has an established
  // pattern elsewhere (gdpr.service.ts's deleteUser anonymizes the row
  // rather than deleting or soft-deleting it), which this dead method
  // predates and doesn't match.
  async remove(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can remove users');
    }
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
