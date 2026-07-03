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

    throw new NotFoundException('No profile found for this username');
  }
}
