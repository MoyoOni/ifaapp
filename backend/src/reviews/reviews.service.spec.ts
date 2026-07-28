import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    productReview: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    babalawoReview: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    courseReview: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendor: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockCurrentUser = {
    id: 'user-1',
    sub: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT' as any,
    verified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createProductReview', () => {
    it('should create a product review', async () => {
      const productId = 'product-1';
      const dto = {
        rating: 5,
        comment: 'Excellent product!',
      };

      const mockReview = {
        id: 'review-1',
        sub: 'review-1',
        productId,
        userId: mockCurrentUser.id,
        ...dto,
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.productReview.create.mockResolvedValue(mockReview);

      const result = await service.createProductReview(productId, dto as any, mockCurrentUser);

      expect(result).toEqual(mockReview);
      expect(prisma.productReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId,
            rating: dto.rating,
          }),
        })
      );
    });

    it('notifies the vendor when a review is received (VENDOR_BACKLOG.md VND-004)', async () => {
      const productId = 'product-1';
      const dto = { rating: 4, content: 'Nice item' };
      const mockReview = {
        id: 'review-1',
        productId,
        rating: 4,
        status: 'PENDING',
        customer: { name: 'Ade', yorubaName: null },
      };

      mockPrismaService.product.findUnique
        .mockResolvedValueOnce({ id: productId }) // existence check
        .mockResolvedValueOnce({ name: 'Ide Beads', vendor: { userId: 'vendor-user-1' } }); // notification lookup
      mockPrismaService.productReview.create.mockResolvedValue(mockReview);

      await service.createProductReview(productId, dto as any, mockCurrentUser);
      await new Promise((resolve) => setImmediate(resolve)); // let the fire-and-forget .then() chain run

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'vendor-user-1',
          type: 'REVIEW_RECEIVED',
          data: expect.objectContaining({ reviewId: 'review-1', productId }),
        })
      );
    });
  });

  describe('getProductReviews', () => {
    it('should return product reviews', async () => {
      const productId = 'product-1';
      const mockReviews = [
        { id: 'review-1', productId, rating: 5, comment: 'Great!' },
        { id: 'review-2', productId, rating: 4, comment: 'Good' },
      ];

      mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getProductReviews(productId);

      expect(result).toEqual(mockReviews);
    });

    it('should filter reviews by status', async () => {
      const productId = 'product-1';
      const mockReviews = [{ id: 'review-1', productId, status: 'ACTIVE' }];

      mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getProductReviews(productId, { status: 'ACTIVE' });

      expect(result).toEqual(mockReviews);
    });
  });

  describe('createBabalawoReview', () => {
    it('should create a babalawo review', async () => {
      const babalawoId = 'babalawo-1';
      const dto = {
        rating: 5,
        comment: 'Very knowledgeable and helpful',
        serviceType: 'DIVINATION',
      };

      const mockReview = {
        id: 'review-1',
        sub: 'review-1',
        babalawoId,
        clientId: mockCurrentUser.id,
        ...dto,
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: babalawoId,
        role: 'BABALAWO',
        verified: true,
      });
      mockPrismaService.babalawoReview.findUnique.mockResolvedValue(null);
      mockPrismaService.appointment.findFirst.mockResolvedValue({ id: 'apt-1' });
      mockPrismaService.babalawoReview.create.mockResolvedValue(mockReview);

      const result = await service.createBabalawoReview(babalawoId, dto as any, mockCurrentUser);

      expect(result).toEqual(mockReview);
    });
  });

  describe('getBabalawoReviews', () => {
    it('should return babalawo reviews', async () => {
      const babalawoId = 'babalawo-1';
      const mockReviews = [
        { id: 'review-1', babalawoId, rating: 5 },
        { id: 'review-2', babalawoId, rating: 4 },
      ];

      mockPrismaService.babalawoReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getBabalawoReviews(babalawoId);

      expect(result).toEqual(mockReviews);
    });
  });

  describe('createCourseReview', () => {
    it('should create a course review', async () => {
      const courseId = 'course-1';
      const dto = {
        rating: 5,
        comment: 'Excellent course content',
      };

      const mockReview = {
        id: 'review-1',
        sub: 'review-1',
        courseId,
        userId: mockCurrentUser.id,
        ...dto,
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      mockPrismaService.course.findUnique.mockResolvedValue({ id: courseId });
      mockPrismaService.courseReview.findUnique.mockResolvedValue(null);
      mockPrismaService.enrollment.findFirst.mockResolvedValue({ id: 'enr-1' });
      mockPrismaService.courseReview.create.mockResolvedValue(mockReview);

      const result = await service.createCourseReview(courseId, dto as any, mockCurrentUser);

      expect(result).toEqual(mockReview);
    });
  });

  describe('getCourseReviews', () => {
    it('should return course reviews', async () => {
      const courseId = 'course-1';
      const mockReviews = [
        { id: 'review-1', courseId, rating: 5 },
        { id: 'review-2', courseId, rating: 4 },
      ];

      mockPrismaService.courseReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getCourseReviews(courseId);

      expect(result).toEqual(mockReviews);
    });
  });

  describe('getProductRatingStats', () => {
    it('should return product rating statistics', async () => {
      const productId = 'product-1';
      const mockStats = {
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      };

      const mockReviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
        { rating: 5 },
      ];

      mockPrismaService.productReview.aggregate.mockResolvedValue(mockStats);
      mockPrismaService.productReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getProductRatingStats(productId);

      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('totalReviews');
    });
  });

  describe('getBabalawoRatingStats', () => {
    it('should return babalawo rating statistics', async () => {
      const babalawoId = 'babalawo-1';
      const mockStats = {
        _avg: { rating: 4.8 },
        _count: { rating: 20 },
      };

      const mockReviews = [{ rating: 5 }, { rating: 5 }, { rating: 4 }];

      mockPrismaService.babalawoReview.aggregate.mockResolvedValue(mockStats);
      mockPrismaService.babalawoReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getBabalawoRatingStats(babalawoId);

      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('totalReviews');
    });
  });

  describe('getCourseRatingStats', () => {
    it('should return course rating statistics', async () => {
      const courseId = 'course-1';
      const mockStats = {
        _avg: { rating: 4.6 },
        _count: { rating: 15 },
      };

      const mockReviews = [{ rating: 5 }, { rating: 4 }, { rating: 5 }];

      mockPrismaService.courseReview.aggregate.mockResolvedValue(mockStats);
      mockPrismaService.courseReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.getCourseRatingStats(courseId);

      expect(result).toHaveProperty('averageRating');
      expect(result).toHaveProperty('totalReviews');
    });
  });

  describe('respondToReview (VENDOR_BACKLOG.md VND-022)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const review = {
      id: 'review-1',
      vendorResponse: null,
      product: { vendorId: 'vendor-1', vendor: { userId: 'vendor-user-1' } },
    };

    it('lets the owning vendor respond to a review with no existing response', async () => {
      mockPrismaService.productReview.findUnique.mockResolvedValue(review);
      mockPrismaService.productReview.update.mockResolvedValue({ ...review, vendorResponse: 'Thank you!' });

      const result = await service.respondToReview(
        'review-1',
        { response: 'Thank you!' },
        owningVendorUser
      );

      expect(prisma.productReview.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: expect.objectContaining({ vendorResponse: 'Thank you!' }),
      });
      expect(result.vendorResponse).toBe('Thank you!');
    });

    it('rejects a vendor responding to a review on another vendor\'s product', async () => {
      mockPrismaService.productReview.findUnique.mockResolvedValue(review);
      const otherVendorUser = { id: 'someone-else', role: 'VENDOR' } as any;

      await expect(
        service.respondToReview('review-1', { response: 'Hi' }, otherVendorUser)
      ).rejects.toThrow('You can only respond to reviews on your own products');
    });

    it('rejects a second response once one already exists', async () => {
      mockPrismaService.productReview.findUnique.mockResolvedValue({
        ...review,
        vendorResponse: 'Already replied',
      });

      await expect(
        service.respondToReview('review-1', { response: 'Again' }, owningVendorUser)
      ).rejects.toThrow('This review already has a response');
      expect(prisma.productReview.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the review does not exist', async () => {
      mockPrismaService.productReview.findUnique.mockResolvedValue(null);

      await expect(
        service.respondToReview('nope', { response: 'Hi' }, owningVendorUser)
      ).rejects.toThrow('Review not found');
    });
  });

  describe('getVendorReviews (VENDOR_BACKLOG.md VND-022)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;

    it('rejects a user who does not own the vendor account', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'someone-else' });

      await expect(service.getVendorReviews('vendor-1', owningVendorUser)).rejects.toThrow(
        'You can only manage your own vendor account'
      );
    });

    it('aggregates reviews across all of a vendor\'s products, with a per-product breakdown', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      const now = new Date();
      mockPrismaService.productReview.findMany.mockResolvedValue([
        { productId: 'p1', product: { name: 'Ide Beads' }, rating: 5, createdAt: now },
        { productId: 'p1', product: { name: 'Ide Beads' }, rating: 3, createdAt: now },
        { productId: 'p2', product: { name: 'Opon Ifa' }, rating: 4, createdAt: now },
      ]);

      const result = await service.getVendorReviews('vendor-1', owningVendorUser);

      expect(result.totalReviews).toBe(3);
      expect(result.averageRating).toBeCloseTo(4, 1);
      expect(result.perProduct).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ productId: 'p1', averageRating: 4, totalReviews: 2 }),
          expect.objectContaining({ productId: 'p2', averageRating: 4, totalReviews: 1 }),
        ])
      );
    });

    it('reports insufficient_data trend direction when there is no review history to compare', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue({ userId: 'vendor-user-1' });
      mockPrismaService.productReview.findMany.mockResolvedValue([]);

      const result = await service.getVendorReviews('vendor-1', owningVendorUser);

      expect(result.trend.direction).toBe('insufficient_data');
    });
  });

  describe('requestReviewForOrder (VENDOR_BACKLOG.md VND-022)', () => {
    const owningVendorUser = { id: 'vendor-user-1', role: 'VENDOR' } as any;
    const deliveredOrder = {
      id: 'order-1',
      customerId: 'customer-1',
      status: 'DELIVERED',
      reviewRequestSentAt: null,
      vendor: { userId: 'vendor-user-1' },
      items: [{ productId: 'product-1' }],
    };

    it('sends a review-request notification and marks the order as sent', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(deliveredOrder);

      const result = await service.requestReviewForOrder('order-1', owningVendorUser);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'customer-1' })
      );
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { reviewRequestSentAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Review request sent' });
    });

    it('rejects requesting a review for an order that has not been delivered', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'SHIPPED' });

      await expect(
        service.requestReviewForOrder('order-1', owningVendorUser)
      ).rejects.toThrow('Reviews can only be requested for delivered orders');
    });

    it('rejects a second request for the same order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...deliveredOrder,
        reviewRequestSentAt: new Date(),
      });

      await expect(
        service.requestReviewForOrder('order-1', owningVendorUser)
      ).rejects.toThrow('A review request has already been sent for this order');
    });

    it('rejects a vendor requesting a review for another vendor\'s order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(deliveredOrder);
      const otherVendorUser = { id: 'someone-else', role: 'VENDOR' } as any;

      await expect(
        service.requestReviewForOrder('order-1', otherVendorUser)
      ).rejects.toThrow('You can only request reviews for your own orders');
    });
  });
});
