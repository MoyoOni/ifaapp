import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicProfileController {
  constructor(private prisma: PrismaService) {}

  @Get('resolve/:slug')
  async resolveSlug(@Param('slug') slug: string) {
    // Check users first (babalawos and clients)
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        yorubaName: true,
        role: true,
        slug: true,
        avatar: true,
        bio: true,
        verified: true,
        location: true,
        culturalLevel: true,
      },
    });

    if (user) {
      return {
        type: user.role === 'BABALAWO' ? 'babalawo' : 'client',
        id: user.id,
        name: user.name,
        yorubaName: user.yorubaName,
        slug: user.slug,
        avatar: user.avatar,
        bio: user.bio,
        verified: user.verified,
        location: user.location,
        culturalLevel: user.culturalLevel,
        role: user.role,
      };
    }

    // Check temples
    const temple = await this.prisma.temple.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true },
    });

    if (temple) {
      return {
        type: 'temple',
        id: temple.id,
        name: temple.name,
        slug: temple.slug,
        avatar: temple.logo,
      };
    }

    // VENDOR_BACKLOG.md VND-021: "Each vendor storefront has:
    // iluase.com/shop/[vendor-slug]" -- Vendor.slug existed (VND-023) but
    // was never checked here, so a vendor's shareable slug link 404'd (or
    // silently rendered the wrong profile type) instead of reaching their
    // storefront. `findVendorByUserId` in marketplace.service.ts already
    // falls back to slug lookup, so the frontend redirect target
    // (/vendors/:id) works with either the vendor's id or its slug.
    const vendor = await this.prisma.vendor.findUnique({
      where: { slug },
      select: { id: true, businessName: true, slug: true, bannerImageUrl: true },
    });

    if (vendor) {
      return {
        type: 'vendor',
        id: vendor.id,
        name: vendor.businessName,
        slug: vendor.slug,
        avatar: vendor.bannerImageUrl,
      };
    }

    throw new NotFoundException('No profile found for this username');
  }
}
