import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, ForumThread, ForumPost, Circle, Temple } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

@Injectable()
export class ElderOversightService {
  private readonly logger = new Logger(ElderOversightService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Verify if a user is a verified elder eligible for oversight functions
   */
  async isVerifiedElder(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        isVerified: true,
        isActive: true
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.role === UserRole.BABALAWO && user.isVerified && user.isActive;
  }

  /**
   * Allow elders to moderate forum threads within their area of expertise
   */
  async moderateForumThread(
    moderatorId: string,
    threadId: string,
    action: 'lock' | 'unlock' | 'pin' | 'unpin' | 'approve' | 'reject' | 'delete',
    reason?: string
  ): Promise<ForumThread> {
    this.logger.log(`Elder ${moderatorId} attempting to ${action} thread ${threadId}`);

    // Verify the moderator is a verified elder
    const isElder = await this.isVerifiedElder(moderatorId);
    if (!isElder) {
      throw new ForbiddenException('Only verified elders can moderate forum threads');
    }

    // Get the thread to moderate
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        temple: true,
        circle: true,
        author: true
      }
    });

    if (!thread) {
      throw new NotFoundException(`Forum thread with ID ${threadId} not found`);
    }

    // Check if the elder has permission to moderate this thread
    // Either they belong to the same temple or circle, or it's a general thread
    const hasPermission = await this.hasModerationPermission(moderatorId, thread);
    if (!hasPermission) {
      throw new ForbiddenException('Elder does not have permission to moderate this thread');
    }

    // Perform the moderation action
    let updatedThread: ForumThread;
    switch (action) {
      case 'lock':
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            isLocked: true,
            lockedById: moderatorId,
            lockedAt: new Date(),
            lockedReason: reason || 'Thread locked by elder oversight'
          }
        });
        break;
        
      case 'unlock':
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            isLocked: false,
            lockedById: null,
            lockedAt: null,
            lockedReason: null
          }
        });
        break;
        
      case 'pin':
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            isPinned: true,
            pinnedById: moderatorId,
            pinnedAt: new Date()
          }
        });
        break;
        
      case 'unpin':
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            isPinned: false,
            pinnedById: null,
            pinnedAt: null
          }
        });
        break;
        
      case 'approve':
        if (thread.status !== 'PENDING') {
          throw new BadRequestException('Thread is not in pending approval state');
        }
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            status: 'APPROVED',
            approvedById: moderatorId,
            approvedAt: new Date()
          }
        });
        break;
        
      case 'reject':
        if (thread.status !== 'PENDING') {
          throw new BadRequestException('Thread is not in pending approval state');
        }
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            status: 'REJECTED',
            rejectedById: moderatorId,
            rejectedAt: new Date(),
            rejectionReason: reason
          }
        });
        break;
        
      case 'delete':
        // For deletion, we'll soft-delete by setting status to DELETED
        updatedThread = await this.prisma.forumThread.update({
          where: { id: threadId },
          data: { 
            status: 'DELETED',
            deletedById: moderatorId,
            deletedAt: new Date(),
            deletionReason: reason
          }
        });
        break;
        
      default:
        throw new BadRequestException(`Invalid moderation action: ${action}`);
    }

    // Log the moderation action
    await this.logModerationAction(moderatorId, 'FORUM_THREAD', threadId, action, reason);

    this.logger.log(`Elder ${moderatorId} successfully performed ${action} on thread ${threadId}`);
    return updatedThread;
  }

  /**
   * Allow elders to moderate forum posts within their area of expertise
   */
  async moderateForumPost(
    moderatorId: string,
    postId: string,
    action: 'remove' | 'approve' | 'reject',
    reason?: string
  ): Promise<ForumPost> {
    this.logger.log(`Elder ${moderatorId} attempting to ${action} post ${postId}`);

    // Verify the moderator is a verified elder
    const isElder = await this.isVerifiedElder(moderatorId);
    if (!isElder) {
      throw new ForbiddenException('Only verified elders can moderate forum posts');
    }

    // Get the post to moderate
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        thread: {
          include: {
            temple: true,
            circle: true,
            author: true
          }
        },
        author: true
      }
    });

    if (!post) {
      throw new NotFoundException(`Forum post with ID ${postId} not found`);
    }

    // Check if the elder has permission to moderate this post
    const hasPermission = await this.hasModerationPermission(moderatorId, post.thread);
    if (!hasPermission) {
      throw new ForbiddenException('Elder does not have permission to moderate this post');
    }

    // Perform the moderation action
    let updatedPost: ForumPost;
    switch (action) {
      case 'remove':
        updatedPost = await this.prisma.forumPost.update({
          where: { id: postId },
          data: { 
            content: '[Content removed by elder oversight]',
            isRemoved: true,
            removedById: moderatorId,
            removedAt: new Date(),
            removalReason: reason
          }
        });
        break;
        
      case 'approve':
        if (post.status !== 'PENDING') {
          throw new BadRequestException('Post is not in pending approval state');
        }
        updatedPost = await this.prisma.forumPost.update({
          where: { id: postId },
          data: { 
            status: 'APPROVED',
            approvedById: moderatorId,
            approvedAt: new Date()
          }
        });
        break;
        
      case 'reject':
        if (post.status !== 'PENDING') {
          throw new BadRequestException('Post is not in pending approval state');
        }
        updatedPost = await this.prisma.forumPost.update({
          where: { id: postId },
          data: { 
            status: 'REJECTED',
            rejectedById: moderatorId,
            rejectedAt: new Date(),
            rejectionReason: reason
          }
        });
        break;
        
      default:
        throw new BadRequestException(`Invalid moderation action: ${action}`);
    }

    // Log the moderation action
    await this.logModerationAction(moderatorId, 'FORUM_POST', postId, action, reason);

    this.logger.log(`Elder ${moderatorId} successfully performed ${action} on post ${postId}`);
    return updatedPost;
  }

  /**
   * Allow elders to endorse content within their area of expertise
   */
  async endorseContent(
    elderId: string,
    contentId: string,
    contentType: 'thread' | 'post' | 'circle' | 'temple',
    endorsementType: 'blessing' | 'verification' | 'recommendation'
  ): Promise<any> {
    this.logger.log(`Elder ${elderId} attempting to endorse ${contentType} ${contentId} with ${endorsementType}`);

    // Verify the elder is a verified elder
    const isElder = await this.isVerifiedElder(elderId);
    if (!isElder) {
      throw new ForbiddenException('Only verified elders can endorse content');
    }

    // Check if the elder has permission to endorse this content
    let hasPermission = false;
    if (contentType === 'thread') {
      const thread = await this.prisma.forumThread.findUnique({
        where: { id: contentId },
        include: { temple: true, circle: true }
      });
      if (thread) {
        hasPermission = await this.hasModerationPermission(elderId, thread);
      }
    } else if (contentType === 'post') {
      const post = await this.prisma.forumPost.findUnique({
        where: { id: contentId },
        include: {
          thread: {
            include: { temple: true, circle: true }
          }
        }
      });
      if (post) {
        hasPermission = await this.hasModerationPermission(elderId, post.thread);
      }
    } else if (contentType === 'circle' || contentType === 'temple') {
      // For circles and temples, elders can only endorse if they belong to them
      hasPermission = await this.hasEntityAccess(elderId, contentId, contentType);
    }

    if (!hasPermission) {
      throw new ForbiddenException(`Elder does not have permission to endorse this ${contentType}`);
    }

    // Create the endorsement
    const endorsement = await this.prisma.endorsement.create({
      data: {
        elderId,
        contentId,
        contentType: contentType.toUpperCase(),
        endorsementType,
        createdAt: new Date()
      }
    });

    this.logger.log(`Elder ${elderId} successfully endorsed ${contentType} ${contentId} with ${endorsementType}`);
    return endorsement;
  }

  /**
   * Check if an elder has permission to moderate content based on temple/circle affiliation
   */
  private async hasModerationPermission(moderatorId: string, thread: any): Promise<boolean> {
    // If the thread belongs to a temple, check if the elder belongs to the same temple
    if (thread.templeId) {
      const elderTemples = await this.prisma.temple.findMany({
        where: {
          OR: [
            { babalawos: { some: { id: moderatorId } } },
            { admins: { some: { id: moderatorId } } }
          ]
        },
        select: { id: true }
      });
      
      return elderTemples.some(temple => temple.id === thread.templeId);
    }

    // If the thread belongs to a circle, check if the elder is part of the circle
    if (thread.circleId) {
      const elderCircles = await this.prisma.circle.findMany({
        where: {
          OR: [
            { moderators: { some: { id: moderatorId } } },
            { admins: { some: { id: moderatorId } } }
          ]
        },
        select: { id: true }
      });
      
      return elderCircles.some(circle => circle.id === thread.circleId);
    }

    // For general threads (not tied to specific temple/circle), elders can moderate
    return true;
  }

  /**
   * Check if an elder has access to a specific entity (temple/circle)
   */
  private async hasEntityAccess(elderId: string, entityId: string, entityType: 'temple' | 'circle'): Promise<boolean> {
    if (entityType === 'temple') {
      const temples = await this.prisma.temple.findMany({
        where: {
          OR: [
            { babalawos: { some: { id: elderId } } },
            { admins: { some: { id: elderId } } }
          ]
        },
        select: { id: true }
      });
      
      return temples.some(temple => temple.id === entityId);
    } else { // circle
      const circles = await this.prisma.circle.findMany({
        where: {
          OR: [
            { moderators: { some: { id: elderId } } },
            { admins: { some: { id: elderId } } }
          ]
        },
        select: { id: true }
      });
      
      return circles.some(circle => circle.id === entityId);
    }
  }

  /**
   * Log moderation actions for accountability
   */
  private async logModerationAction(
    moderatorId: string,
    targetType: string,
    targetId: string,
    action: string,
    reason?: string
  ): Promise<void> {
    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        targetType,
        targetId,
        action,
        reason: reason || 'No reason provided',
        timestamp: new Date()
      }
    });
  }

  /**
   * Get moderation history for an elder
   */
  async getModerationHistory(elderId: string): Promise<any[]> {
    this.logger.log(`Retrieving moderation history for elder ${elderId}`);

    const isElder = await this.isVerifiedElder(elderId);
    if (!isElder) {
      throw new ForbiddenException('Only verified elders can view their moderation history');
    }

    const logs = await this.prisma.moderationLog.findMany({
      where: { moderatorId: elderId },
      orderBy: { timestamp: 'desc' },
      take: 50, // Limit to last 50 actions
      include: {
        moderator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return logs;
  }

  /**
   * Get pending items that need elder oversight
   */
  async getItemsNeedingOversight(elderId: string): Promise<{
    pendingThreads: ForumThread[];
    pendingPosts: ForumPost[];
  }> {
    this.logger.log(`Retrieving items needing oversight for elder ${elderId}`);

    const isElder = await this.isVerifiedElder(elderId);
    if (!isElder) {
      throw new ForbiddenException('Only verified elders can view items needing oversight');
    }

    // Find temples and circles the elder belongs to
    const elderTemples = await this.prisma.temple.findMany({
      where: {
        OR: [
          { babalawos: { some: { id: elderId } } },
          { admins: { some: { id: elderId } } }
        ]
      },
      select: { id: true }
    });

    const elderCircles = await this.prisma.circle.findMany({
      where: {
        OR: [
          { moderators: { some: { id: elderId } } },
          { admins: { some: { id: elderId } } }
        ]
      },
      select: { id: true }
    });

    // Get pending threads in areas the elder can moderate
    const pendingThreads = await this.prisma.forumThread.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { templeId: { in: elderTemples.map(t => t.id) } },
          { circleId: { in: elderCircles.map(c => c.id) } },
          { templeId: null, circleId: null } // General threads
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isVerified: true
          }
        },
        temple: {
          select: {
            id: true,
            name: true
          }
        },
        circle: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get pending posts in threads the elder can access
    const threadIds = [...pendingThreads.map(t => t.id)];
    
    const pendingPosts = await this.prisma.forumPost.findMany({
      where: {
        status: 'PENDING',
        threadId: { in: threadIds }
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isVerified: true
          }
        },
        thread: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return {
      pendingThreads,
      pendingPosts
    };
  }
}