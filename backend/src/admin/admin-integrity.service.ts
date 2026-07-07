import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RejectPostDto } from './dto/reject-post.dto';
import { CreateFlagRuleDto } from './dto/create-flag-rule.dto';
import { UpdateFlagRuleDto } from './dto/update-flag-rule.dto';

@Injectable()
export class AdminIntegrityService {
  constructor(private prisma: PrismaService) {}

  // ===== Review Queue =====

  async getQueue(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where: { heldForReview: true },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true, culturalLevel: true } },
          thread: { select: { id: true, title: true, category: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.forumPost.count({ where: { heldForReview: true } }),
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async approvePost(postId: string, admin: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.heldForReview) throw new BadRequestException('Post is not held for review');

    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        heldForReview: false,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });
  }

  async rejectPost(postId: string, admin: CurrentUserPayload, dto: RejectPostDto) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.heldForReview) throw new BadRequestException('Post is not held for review');

    // Set heldForReview: false and mark status as REJECTED
    // The reason is not stored in the post, but could be sent via notification later.
    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        heldForReview: false,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        status: 'REJECTED',
      },
    });
  }

  // ===== Flag Rules =====

  async getRules() {
    return this.prisma.contentFlagRule.findMany({
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(dto: CreateFlagRuleDto, admin: CurrentUserPayload) {
    return this.prisma.contentFlagRule.create({
      data: {
        type: dto.type,
        value: dto.value,
        reason: dto.reason,
        createdBy: admin.id,
      },
    });
  }

  async updateRule(id: string, dto: UpdateFlagRuleDto) {
    const rule = await this.prisma.contentFlagRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Flag rule not found');

    return this.prisma.contentFlagRule.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.contentFlagRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Flag rule not found');
    return this.prisma.contentFlagRule.delete({ where: { id } });
  }
}