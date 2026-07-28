import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicProfileController } from './public-profile.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('PublicProfileController', () => {
  let controller: PublicProfileController;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    temple: { findUnique: jest.fn() },
    vendor: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicProfileController],
      providers: [{ provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    controller = module.get<PublicProfileController>(PublicProfileController);
  });

  it('resolves a user slug', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1', name: 'Ade', role: 'BABALAWO', slug: 'ade', yorubaName: null,
      avatar: null, bio: null, verified: true, location: null, culturalLevel: null,
    });

    const result = await controller.resolveSlug('ade');

    expect(result).toMatchObject({ type: 'babalawo', id: 'user-1' });
  });

  it('resolves a temple slug when no user matches', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.temple.findUnique.mockResolvedValue({ id: 'temple-1', name: 'Osun Grove', slug: 'osun-grove', logo: null });

    const result = await controller.resolveSlug('osun-grove');

    expect(result).toMatchObject({ type: 'temple', id: 'temple-1' });
  });

  // VENDOR_BACKLOG.md VND-021: Vendor.slug existed (VND-023) but was never
  // checked here -- a vendor's shareable slug link fell through to the 404
  // instead of resolving to their storefront.
  it('resolves a vendor slug when no user or temple matches', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.temple.findUnique.mockResolvedValue(null);
    mockPrismaService.vendor.findUnique.mockResolvedValue({
      id: 'vendor-1', businessName: 'Oshun Beads', slug: 'oshun-beads', bannerImageUrl: null,
    });

    const result = await controller.resolveSlug('oshun-beads');

    expect(result).toEqual({ type: 'vendor', id: 'vendor-1', name: 'Oshun Beads', slug: 'oshun-beads', avatar: null });
  });

  it('throws NotFoundException when nothing matches', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.temple.findUnique.mockResolvedValue(null);
    mockPrismaService.vendor.findUnique.mockResolvedValue(null);

    await expect(controller.resolveSlug('nobody')).rejects.toThrow(NotFoundException);
  });
});
