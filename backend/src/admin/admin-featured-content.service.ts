import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFeaturedDto } from './dto/update-featured.dto';

@Injectable()
export class AdminFeaturedContentService {
  constructor(private prisma: PrismaService) {}

  async getFeaturedContent() {
    const [threads, products, courses, circles] = await Promise.all([
      this.prisma.forumThread.findMany({
        where: { isFeatured: true },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: { featuredUntil: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { isFeatured: true },
        include: {
          vendor: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { featuredUntil: 'asc' },
      }),
      this.prisma.course.findMany({
        where: { isFeatured: true },
        include: {
          instructor: { select: { id: true, name: true } },
        },
        orderBy: { featuredUntil: 'asc' },
      }),
      this.prisma.circle.findMany({
        where: { isFeatured: true },
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { featuredUntil: 'asc' },
      }),
    ]);

    return {
      threads: this.mapThreads(threads),
      products: this.mapProducts(products),
      courses: this.mapCourses(courses),
      circles: this.mapCircles(circles),
    };
  }

  async search(type: string, query: string) {
    let items: any[];
    switch (type) {
      case 'thread':
        items = await this.prisma.forumThread.findMany({
          where: { title: { contains: query, mode: 'insensitive' } },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            category: { select: { id: true, name: true } },
          },
          take: 20,
        });
        return this.mapThreads(items);
      case 'product':
        items = await this.prisma.product.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          include: {
            vendor: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
          take: 20,
        });
        return this.mapProducts(items);
      case 'course':
        items = await this.prisma.course.findMany({
          where: { title: { contains: query, mode: 'insensitive' } },
          include: {
            instructor: { select: { id: true, name: true } },
          },
          take: 20,
        });
        return this.mapCourses(items);
      case 'circle':
        items = await this.prisma.circle.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          include: {
            creator: { select: { id: true, name: true, avatar: true } },
          },
          take: 20,
        });
        return this.mapCircles(items);
      default:
        throw new BadRequestException('Invalid type');
    }
  }

  async updateFeatured(type: string, id: string, dto: UpdateFeaturedDto) {
    let model: any;
    switch (type) {
      case 'thread':
        model = this.prisma.forumThread;
        break;
      case 'product':
        model = this.prisma.product;
        break;
      case 'course':
        model = this.prisma.course;
        break;
      case 'circle':
        model = this.prisma.circle;
        break;
      default:
        throw new BadRequestException('Invalid type');
    }

    const item = await model.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`${type} not found`);

    return model.update({
      where: { id },
      data: {
        isFeatured: dto.featured,
        featuredUntil: dto.featuredUntil ? new Date(dto.featuredUntil) : null,
      },
    });
  }

  // Mapping helpers (to unify response shape)
  private mapThreads(threads: any[]) {
    return threads.map((t) => ({
      id: t.id,
      title: t.title,
      type: 'thread',
      owner: t.author,
      label: t.title,
      isFeatured: t.isFeatured,
      featuredUntil: t.featuredUntil,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  private mapProducts(products: any[]) {
    return products.map((p) => ({
      id: p.id,
      title: p.name,
      type: 'product',
      owner: {
        id: p.vendor.id,
        name: p.vendor.businessName,
        email: p.vendor.user?.email,
      },
      label: p.name,
      isFeatured: p.isFeatured,
      featuredUntil: p.featuredUntil,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  private mapCourses(courses: any[]) {
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      type: 'course',
      owner: c.instructor,
      label: c.title,
      isFeatured: c.isFeatured,
      featuredUntil: c.featuredUntil,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  private mapCircles(circles: any[]) {
    return circles.map((c) => ({
      id: c.id,
      title: c.name,
      type: 'circle',
      owner: c.creator,
      label: c.name,
      isFeatured: c.isFeatured,
      featuredUntil: c.featuredUntil,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }
}
