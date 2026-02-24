import { Test, TestingModule } from '@nestjs/testing';
import { ForumService } from './forum.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

jest.mock('@ile-ase/common', () => {
  const actual = jest.requireActual('@ile-ase/common');
  return {
    ...actual,
    ThreadStatus: { ACTIVE: 'ACTIVE', LOCKED: 'LOCKED', DELETED: 'DELETED' },
    PostStatus: { ACTIVE: 'ACTIVE', EDITED: 'EDITED', DELETED: 'DELETED' },
  };
});

describe('ForumService', () => {
    let service: ForumService;
    let prisma: PrismaService;

    const mockPrismaService = {
        forumCategory: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        forumThread: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        forumPost: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        postAcknowledgment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        $transaction: jest.fn((arg) => (Array.isArray(arg) ? Promise.all(arg) : arg)),
    };

    const mockCurrentUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: 'CLIENT' as any,
        verified: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ForumService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ForumService>(ForumService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('findAllCategories', () => {
        it('should return all forum categories', async () => {
            const mockCategories = [
                { id: 'cat-1', name: 'General Discussion', slug: 'general', threadCount: 10 },
                { id: 'cat-2', name: 'Teachings', slug: 'teachings', threadCount: 5 },
            ];

            mockPrismaService.forumCategory.findMany.mockResolvedValue(mockCategories);

            const result = await service.findAllCategories();

            expect(result).toEqual(mockCategories);
            expect(prisma.forumCategory.findMany).toHaveBeenCalled();
        });
    });

    describe('findCategoryBySlug', () => {
        it('should return category by slug', async () => {
            const mockCategory = {
                id: 'cat-1',
                name: 'General Discussion',
                slug: 'general',
            };

            mockPrismaService.forumCategory.findUnique.mockResolvedValue(mockCategory);

            const result = await service.findCategoryBySlug('general');

            expect(result).toEqual(mockCategory);
        });

        it('should throw NotFoundException when category not found', async () => {
            mockPrismaService.forumCategory.findUnique.mockResolvedValue(null);

            await expect(service.findCategoryBySlug('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('createCategory', () => {
        it('should create a forum category (admin only)', async () => {
            const dto = {
                name: 'New Category',
                slug: 'new-category',
                description: 'A new discussion category',
            };

            const adminUser = {
                ...mockCurrentUser,
                role: 'ADMIN' as any,
            };

            const mockCategory = {
                id: 'cat-new',
                ...dto,
                threadCount: 0,
                createdAt: new Date(),
            };

            mockPrismaService.forumCategory.create.mockResolvedValue(mockCategory);

            const result = await service.createCategory(dto as any, adminUser);

            expect(result).toEqual(mockCategory);
        });
    });

    describe('findAllThreads', () => {
        it('should return all threads', async () => {
            const mockThreads = [
                { id: 'thread-1', title: 'Thread 1', categoryId: 'cat-1' },
                { id: 'thread-2', title: 'Thread 2', categoryId: 'cat-1' },
            ];

            mockPrismaService.forumThread.findMany.mockResolvedValue(mockThreads);

            const result = await service.findAllThreads();

            expect(result).toEqual(mockThreads);
        });

        it('should filter threads by category', async () => {
            const categoryId = 'cat-1';
            const mockThreads = [
                { id: 'thread-1', title: 'Thread 1', categoryId },
            ];

            mockPrismaService.forumThread.findMany.mockResolvedValue(mockThreads);

            const result = await service.findAllThreads(categoryId);

            expect(result).toEqual(mockThreads);
            expect(prisma.forumThread.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({ categoryId }),
                include: expect.any(Object),
                orderBy: expect.any(Object),
            });
        });
    });

    describe('createThread', () => {
        it('should create a forum thread', async () => {
            const dto = {
                categoryId: 'cat-1',
                title: 'New Discussion Thread',
                content: 'This is the first post content',
            };

            const mockThread = {
                id: 'thread-1',
                ...dto,
                authorId: mockCurrentUser.id,
                status: 'ACTIVE',
                createdAt: new Date(),
            };

            mockPrismaService.forumCategory.findUnique.mockResolvedValue({
                id: dto.categoryId,
                isActive: true,
                name: 'General',
                slug: 'general',
            });
            mockPrismaService.forumThread.create.mockResolvedValue(mockThread);

            const result = await service.createThread(dto as any, mockCurrentUser);

            expect(result).toEqual(mockThread);
            expect(prisma.forumThread.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    categoryId: dto.categoryId,
                    title: dto.title,
                    authorId: mockCurrentUser.id,
                }),
                include: expect.any(Object),
            });
        });
    });

    describe('findThreadById', () => {
        it('should return thread with posts', async () => {
            const mockThread = {
                id: 'thread-1',
                title: 'Test Thread',
                posts: [
                    { id: 'post-1', content: 'First post' },
                    { id: 'post-2', content: 'Second post' },
                ],
            };

            mockPrismaService.forumThread.findUnique.mockResolvedValue(mockThread);

            const result = await service.findThreadById('thread-1');

            expect(result).toEqual(mockThread);
        });

        it('should throw NotFoundException when thread not found', async () => {
            mockPrismaService.forumThread.findUnique.mockResolvedValue(null);

            await expect(service.findThreadById('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateThread', () => {
        it('should update thread when user is author', async () => {
            const threadId = 'thread-1';
            const dto = { title: 'Updated Title' };

            const mockThread = {
                id: threadId,
                title: 'Original Title',
                authorId: mockCurrentUser.id,
            };

            const mockUpdatedThread = {
                ...mockThread,
                title: dto.title,
            };

            mockPrismaService.forumThread.findUnique.mockResolvedValue(mockThread);
            mockPrismaService.forumThread.update.mockResolvedValue(mockUpdatedThread);

            const result = await service.updateThread(threadId, dto as any, mockCurrentUser);

            expect(result).toEqual(mockUpdatedThread);
        });

        it('should throw ForbiddenException when user is not author', async () => {
            const threadId = 'thread-1';
            const dto = { title: 'Hacked Title' };

            const mockThread = {
                id: threadId,
                authorId: 'other-user',
            };

            mockPrismaService.forumThread.findUnique.mockResolvedValue(mockThread);

            await expect(service.updateThread(threadId, dto as any, mockCurrentUser)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('createPost', () => {
        it('should create a forum post', async () => {
            const dto = {
                threadId: 'thread-1',
                content: 'This is my reply to the thread',
            };

            const mockPost = {
                id: 'post-1',
                ...dto,
                authorId: mockCurrentUser.id,
                status: 'ACTIVE',
                createdAt: new Date(),
            };

            mockPrismaService.forumThread.findUnique.mockResolvedValue({ id: dto.threadId });
            mockPrismaService.forumPost.create.mockResolvedValue(mockPost);

            const result = await service.createPost(dto as any, mockCurrentUser);

            expect(result).toEqual(mockPost);
            expect(prisma.forumPost.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    threadId: dto.threadId,
                    content: dto.content,
                    authorId: mockCurrentUser.id,
                }),
                include: expect.any(Object),
            });
        });
    });

    describe('acknowledgePost', () => {
        it('should acknowledge a post', async () => {
            const postId = 'post-1';

            const mockAcknowledgment = {
                id: 'ack-1',
                postId,
                userId: mockCurrentUser.id,
                createdAt: new Date(),
            };

            mockPrismaService.forumPost.findUnique.mockResolvedValue({ id: postId, acknowledgeCount: 0 });
            mockPrismaService.postAcknowledgment.findUnique.mockResolvedValue(null);
            mockPrismaService.postAcknowledgment.create.mockResolvedValue(mockAcknowledgment);

            const result = await service.acknowledgePost(postId, mockCurrentUser);

            expect(result).toMatchObject({ acknowledged: true });
        });
    });

    describe('getPostAcknowledgments', () => {
        it('should return post acknowledgments as users', async () => {
            const postId = 'post-1';
            const mockUser1 = { id: 'user-1', name: 'User 1' };
            const mockUser2 = { id: 'user-2', name: 'User 2' };
            const mockAcknowledgments = [
                { id: 'ack-1', postId, userId: 'user-1', user: mockUser1 },
                { id: 'ack-2', postId, userId: 'user-2', user: mockUser2 },
            ];

            mockPrismaService.postAcknowledgment.findMany.mockResolvedValue(mockAcknowledgments);

            const result = await service.getPostAcknowledgments(postId);

            expect(result).toEqual([mockUser1, mockUser2]);
        });
    });

    describe('deletePost', () => {
        it('should delete post when user is author', async () => {
            const postId = 'post-1';

            const mockPost = {
                id: postId,
                authorId: mockCurrentUser.id,
                content: 'Post content',
            };

            const mockPostWithThread = { ...mockPost, threadId: 'thread-1' };
            mockPrismaService.forumPost.findUnique.mockResolvedValue(mockPostWithThread);
            mockPrismaService.forumPost.update.mockResolvedValue({ ...mockPost, status: 'DELETED' });
            mockPrismaService.forumThread.update.mockResolvedValue({});

            const result = await service.deletePost(postId, mockCurrentUser);

            expect(prisma.forumPost.update).toHaveBeenCalledWith({
                where: { id: postId },
                data: expect.objectContaining({ status: 'DELETED' }),
            });
        });
    });
});
