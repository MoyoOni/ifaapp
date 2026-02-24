import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ThreadStatus, PostStatus } from '@ile-ase/common';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  // ==================== Categories ====================

  async findAllCategories() {
    return this.prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { threads: true },
        },
      },
    });
  }

  async findCategoryBySlug(slug: string) {
    const category = await this.prisma.forumCategory.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto, currentUser: CurrentUserPayload) {
    // Only admins can create categories
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create categories');
    }

    return this.prisma.forumCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
        order: dto.order || 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isTeachings: dto.isTeachings || false,
      },
    });
  }

  // ==================== Threads ====================

  async findAllThreads(categoryId?: string, status?: string) {
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'DELETED' }; // Don't show deleted threads
    }

    // Only show approved threads (unless admin)
    where.isApproved = true;

    return this.prisma.forumThread.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        lastPoster: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  async findThreadById(id: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isTeachings: true,
          },
        },
        lastPoster: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!thread || thread.status === 'DELETED') {
      throw new NotFoundException('Thread not found');
    }

    // Increment view count
    await this.prisma.forumThread.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return thread;
  }

  async createThread(dto: CreateThreadDto, currentUser: CurrentUserPayload) {
    // Verify category exists
    const category = await this.prisma.forumCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isActive) {
      throw new BadRequestException('Cannot create thread in inactive category');
    }

    // Check if teachings category - requires approval
    const isApproved = category.isTeachings
      ? false
      : dto.isApproved !== undefined
        ? dto.isApproved
        : true;

    // Create thread
    const thread = await this.prisma.forumThread.create({
      data: {
        categoryId: dto.categoryId,
        authorId: currentUser.id,
        title: dto.title,
        content: dto.content,
        status: ThreadStatus.ACTIVE,
        isApproved,
        postCount: 1, // First post is the thread content
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create first post (thread content)
    await this.prisma.forumPost.create({
      data: {
        threadId: thread.id,
        authorId: currentUser.id,
        content: dto.content,
        status: PostStatus.ACTIVE,
      },
    });

    // Update category thread count
    await this.prisma.forumCategory.update({
      where: { id: dto.categoryId },
      data: { threadCount: { increment: 1 } },
    });

    // Check if this is a circle suggestion category
    const isCircleSuggestionCategory =
      category.slug === 'circle-suggestions' ||
      category.name.toLowerCase().includes('circle suggestion');

    if (isCircleSuggestionCategory) {
      // Create circle suggestion record
      await this.prisma.circleSuggestion.create({
        data: {
          suggestedBy: currentUser.id,
          threadId: thread.id,
          status: 'PENDING',
        },
      });
    }

    return thread;
  }

  async updateThread(id: string, dto: UpdateThreadDto, currentUser: CurrentUserPayload) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Only author or admin can update
    if (thread.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own threads');
    }

    // Update thread
    return this.prisma.forumThread.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.status && { status: dto.status }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
        ...(dto.isApproved !== undefined && { isApproved: dto.isApproved }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async deleteThread(id: string, currentUser: CurrentUserPayload) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Only author or admin can delete
    if (thread.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own threads');
    }

    // Soft delete
    return this.prisma.forumThread.update({
      where: { id },
      data: { status: ThreadStatus.DELETED },
    });
  }

  // ==================== Posts ====================

  async acknowledgePost(postId: string, currentUser: CurrentUserPayload) {
    // Check if post exists
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already acknowledged
    const existingAcknowledgment = await this.prisma.postAcknowledgment.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUser.id,
        },
      },
    });

    if (existingAcknowledgment) {
      throw new BadRequestException('You have already acknowledged this post');
    }

    // Create acknowledgment and increment count
    await this.prisma.$transaction([
      this.prisma.postAcknowledgment.create({
        data: {
          postId,
          userId: currentUser.id,
        },
      }),
      this.prisma.forumPost.update({
        where: { id: postId },
        data: {
          acknowledgeCount: { increment: 1 },
        },
      }),
    ]);

    return { acknowledged: true, acknowledgeCount: post.acknowledgeCount + 1 };
  }

  async unacknowledgePost(postId: string, currentUser: CurrentUserPayload) {
    // Check if post exists
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if acknowledged
    const existingAcknowledgment = await this.prisma.postAcknowledgment.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUser.id,
        },
      },
    });

    if (!existingAcknowledgment) {
      throw new BadRequestException('You have not acknowledged this post');
    }

    // Remove acknowledgment and decrement count
    await this.prisma.$transaction([
      this.prisma.postAcknowledgment.delete({
        where: {
          postId_userId: {
            postId,
            userId: currentUser.id,
          },
        },
      }),
      this.prisma.forumPost.update({
        where: { id: postId },
        data: {
          acknowledgeCount: { increment: -1 },
        },
      }),
    ]);

    return { acknowledged: false, acknowledgeCount: Math.max(0, post.acknowledgeCount - 1) };
  }

  async getPostAcknowledgments(postId: string) {
    const acknowledgments = await this.prisma.postAcknowledgment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return acknowledgments.map((ack) => ack.user);
  }

  async findAllPosts(threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.status === 'DELETED') {
      throw new NotFoundException('Thread not found');
    }

    return this.prisma.forumPost.findMany({
      where: {
        threadId,
        status: { not: PostStatus.DELETED },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
    });
  }

  async findPostById(id: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            isLocked: true,
            status: true,
          },
        },
      },
    });

    if (!post || post.status === PostStatus.DELETED) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async createPost(dto: CreatePostDto, currentUser: CurrentUserPayload) {
    // Verify thread exists and is not locked
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: dto.threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.isLocked && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot post in locked thread');
    }

    if (thread.status === 'DELETED') {
      throw new BadRequestException('Cannot post in deleted thread');
    }

    // Create post
    const post = await this.prisma.forumPost.create({
      data: {
        threadId: dto.threadId,
        authorId: currentUser.id,
        content: dto.content,
        status: PostStatus.ACTIVE,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
    });

    // Update thread post count and last post info
    await this.prisma.forumThread.update({
      where: { id: dto.threadId },
      data: {
        postCount: { increment: 1 },
        lastPostAt: new Date(),
        lastPostBy: currentUser.id,
      },
    });

    return post;
  }

  async updatePost(id: string, dto: UpdatePostDto, currentUser: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only author or admin can update
    if (post.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Update post
    return this.prisma.forumPost.update({
      where: { id },
      data: {
        content: dto.content,
        isEdited: true,
        editedAt: new Date(),
        status: PostStatus.EDITED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
    });
  }

  async deletePost(id: string, currentUser: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only author or admin can delete
    if (post.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete
    const deletedPost = await this.prisma.forumPost.update({
      where: { id },
      data: { status: PostStatus.DELETED },
    });

    // Update thread post count
    await this.prisma.forumThread.update({
      where: { id: post.threadId },
      data: { postCount: { decrement: 1 } },
    });

    return deletedPost;
  }

  // ==================== Moderation ====================

  async moderateThread(
    id: string,
    action: 'approve' | 'lock' | 'unlock' | 'pin' | 'unpin',
    currentUser: CurrentUserPayload
  ) {
    // Only admins can moderate
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate threads');
    }

    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const updateData: any = {};

    switch (action) {
      case 'approve':
        updateData.isApproved = true;
        break;
      case 'lock':
        updateData.isLocked = true;
        break;
      case 'unlock':
        updateData.isLocked = false;
        break;
      case 'pin':
        updateData.isPinned = true;
        break;
      case 'unpin':
        updateData.isPinned = false;
        break;
    }

    return this.prisma.forumThread.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
