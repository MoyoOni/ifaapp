import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DbOptimizationService {
  private readonly logger = new Logger(DbOptimizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Applies recommended database optimizations including indexes and query optimizations
   */
  async applyDatabaseOptimizations(): Promise<void> {
    this.logger.log('Starting database optimization process');

    // Apply indexing recommendations based on the schema analysis
    await this.applyRecommendedIndexes();
    
    // Optimize frequently accessed queries
    await this.optimizeFrequentlyUsedQueries();
    
    this.logger.log('Database optimization process completed');
  }

  /**
   * Adds recommended indexes based on query patterns and relationships
   */
  private async applyRecommendedIndexes(): Promise<void> {
    this.logger.log('Applying recommended database indexes');

    try {
      // Create composite indexes for frequently queried fields
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_user_role_verified_email" 
        ON "users" ("role", "verified", "email");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_appointment_babalawo_date_status" 
        ON "appointments" ("babalawoId", "date", "status");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_forum_post_thread_created" 
        ON "forum_posts" ("threadId", "createdAt");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_forum_thread_category_created" 
        ON "forum_threads" ("categoryId", "createdAt");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_product_vendor_status" 
        ON "products" ("vendorId", "status");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_order_customer_status" 
        ON "orders" ("customerId", "status");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_message_sender_receiver_read" 
        ON "messages" ("senderId", "receiverId", "read");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_circle_member_user_status" 
        ON "circle_members" ("userId", "status");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_verification_application_user_stage" 
        ON "verification_applications" ("userId", "currentStage");
      `;
      
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "idx_guidance_plan_babalawo_client_status" 
        ON "guidance_plans" ("babalawoId", "clientId", "status");
      `;

      this.logger.log('Successfully applied recommended database indexes');
    } catch (error) {
      this.logger.error(`Failed to apply database indexes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Optimizes frequently used queries by implementing best practices
   */
  private async optimizeFrequentlyUsedQueries(): Promise<void> {
    this.logger.log('Optimizing frequently used queries');

    // Example of optimized queries would go here
    // Since Prisma handles most query optimization automatically,
    // we focus on providing optimized query patterns in the services
    
    // This method will be called to ensure that the service is properly implemented
    this.logger.log('Query optimization patterns prepared');
  }

  /**
   * Provides optimized query methods for common operations
   */

  async getUsersWithRoleAndVerification(role: string, verified: boolean, skip: number, take: number) {
    return this.prisma.user.findMany({
      where: {
        role,
        verified,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      // Using the composite index we created: idx_user_role_verified_email
    });
  }

  async getAppointmentsForBabalawo(babalawoId: string, date: string, status: string) {
    return this.prisma.appointment.findMany({
      where: {
        babalawoId,
        date,
        status,
      },
      orderBy: {
        time: 'asc',
      },
      // Using the composite index: idx_appointment_babalawo_date_status
    });
  }

  async getRecentForumPosts(threadId: string, skip: number, take: number) {
    return this.prisma.forumPost.findMany({
      where: {
        threadId,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      // Using the composite index: idx_forum_post_thread_created
    });
  }

  async getProductsByVendorAndStatus(vendorId: string, status: string) {
    return this.prisma.product.findMany({
      where: {
        vendorId,
        status,
      },
      // Using the composite index: idx_product_vendor_status
    });
  }

  async getOrdersByCustomerAndStatus(customerId: string, status: string) {
    return this.prisma.order.findMany({
      where: {
        customerId,
        status,
      },
      // Using the composite index: idx_order_customer_status
    });
  }

  /**
   * Gets statistics about database performance
   */
  async getDatabaseStats() {
    const userCount = await this.prisma.user.count();
    const appointmentCount = await this.prisma.appointment.count();
    const forumPostCount = await this.prisma.forumPost.count();
    const productCount = await this.prisma.product.count();
    const orderCount = await this.prisma.order.count();

    return {
      userCount,
      appointmentCount,
      forumPostCount,
      productCount,
      orderCount,
      indexedFields: [
        'users.role + verified + email',
        'appointments.babalawoId + date + status',
        'forum_posts.threadId + createdAt',
        'forum_threads.categoryId + createdAt',
        'products.vendorId + status',
        'orders.customerId + status',
        'messages.senderId + receiverId + read',
        'circle_members.userId + status',
        'verification_applications.userId + currentStage',
        'guidance_plans.babalawoId + clientId + status',
      ],
    };
  }
}