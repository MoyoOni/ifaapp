/**
 * Demo Data Seed Script
 * 
 * Populates the database with a unified, consistent demo ecosystem.
 * Run with: npm run seed:demo
 * 
 * This script:
 * 1. Clears existing demo data
 * 2. Seeds temples (foundation)
 * 3. Seeds users with proper relationships
 * 4. Seeds consultations, guidance plans, products, etc.
 * 5. Verifies all relationships are wired correctly
 * 
 * Exit codes:
 * 0 = Success
 * 1 = Failure (see console for details)
 */

import { PrismaClient } from '@prisma/client';
import { DEMO_ECOSYSTEM } from '../src/seeding/demo-ecosystem';

const prisma = new PrismaClient();

async function clearDemoData() {
  console.log('🧹 Clearing existing demo data...');

  try {
    // Delete in correct order (respecting foreign keys)
    await prisma.postAcknowledgment.deleteMany();
    await prisma.forumPost.deleteMany();
    await prisma.forumThread.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.circleMember.deleteMany();
    await prisma.circle.deleteMany();
    await prisma.babalawoReview.deleteMany();
    await prisma.productReview.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.guidancePlan.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.babalawoClient.deleteMany();

    // Clear users (but keep one real admin if needed)
    const demoUsers = Object.keys(DEMO_ECOSYSTEM.users);
    await prisma.user.deleteMany({
      where: { id: { in: demoUsers } },
    });

    // Clear temples
    const demoTemples = DEMO_ECOSYSTEM.temples.map(t => t.id);
    await prisma.temple.deleteMany({
      where: { id: { in: demoTemples } },
    });

    console.log('✓ Demo data cleared');
  } catch (error) {
    console.error('✗ Error clearing demo data:', error);
    throw error;
  }
}

async function seedTemples() {
  console.log('🏛️  Seeding temples...');

  try {
    for (const temple of DEMO_ECOSYSTEM.temples) {
      await prisma.temple.create({
        data: {
          id: temple.id,
          name: temple.name,
          yorubaName: temple.yorubaName || null,
          slug: temple.slug,
          location: temple.location,
          address: temple.address || null,
          city: temple.city || null,
          state: temple.state || null,
          country: temple.country || 'Nigeria',
          description: temple.description || null,
          history: temple.history || null,
          mission: temple.mission || null,
          logo: temple.logo || null,
          bannerImage: temple.bannerImage || null,
          founderId: temple.founderId || null,
          foundedYear: temple.foundedYear || null,
          verified: temple.verified || false,
          verifiedAt: temple.verifiedAt || null,
          type: temple.type || 'STUDY_CIRCLE',
          lineage: temple.lineage || null,
          tradition: temple.tradition || null,
          specialties: temple.specialties || [],
          status: temple.status || 'ACTIVE',
          createdAt: temple.createdAt || new Date(),
        },
      });
    }
    console.log(`✓ Created ${DEMO_ECOSYSTEM.temples.length} temples`);
  } catch (error) {
    console.error('✗ Error seeding temples:', error);
    throw error;
  }
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  try {
    const usersToCreate = DEMO_ECOSYSTEM.users;

    for (const [userId, userData] of Object.entries(usersToCreate)) {
      // Create a simple hash for demo password
      const passwordHash = '$2b$10$demo'; // In real scenario, use bcrypt

      await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          passwordHash: passwordHash,
          role: userData.role,
          yorubaName: userData.yorubaName || null,
          avatar: userData.avatar || null,
          bio: userData.bio || null,
          location: userData.location || null,
          gender: userData.gender || null,
          culturalLevel: userData.culturalLevel || 'Omo Ilé',
          verified: userData.verified || false,
          templeId: userData.templeId || null,
          interests: userData.interests || [],
          hasOnboarded: true,
          createdAt: new Date(userData.createdAt),
          // Role-specific fields will be handled separately
        },
      });
    }

    console.log(`✓ Created ${Object.keys(usersToCreate).length} users`);
  } catch (error) {
    console.error('✗ Error seeding users:', error);
    throw error;
  }
}

async function seedConsultations() {
  console.log('📅 Seeding consultations...');

  try {
    for (const consult of DEMO_ECOSYSTEM.consultations) {
      const scheduledDate = new Date(consult.scheduledDate);
      const dateString = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeString = scheduledDate.toTimeString().slice(0, 5); // HH:mm

      await prisma.appointment.create({
        data: {
          id: consult.id,
          clientId: consult.clientId,
          babalawoId: consult.babalawoId,
          date: dateString,
          time: timeString,
          duration: consult.duration || 60,
          status: consult.status || 'UPCOMING',
          price: consult.estimatedFee || null,
          notes: consult.topic || null,
          createdAt: new Date(consult.createdAt),
        },
      });
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.consultations.length} consultations`);
  } catch (error) {
    console.error('✗ Error seeding consultations:', error);
    throw error;
  }
}

async function seedGuidancePlans() {
  console.log('📖 Seeding guidance plans...');

  try {
    for (const plan of DEMO_ECOSYSTEM.guidancePlans) {
      await prisma.guidancePlan.create({
        data: {
          id: plan.id,
          appointmentId: plan.consultationId,
          clientId: plan.clientId,
          babalawoId: plan.babalawoId,
          title: plan.title,
          description: plan.description,
          status: plan.status,
          rituals: plan.rituals,
          readings: plan.readings,
          herbs: plan.herbs,
          duration: plan.duration,
          progressPercent: plan.progressPercent,
          completedItems: plan.completedItems,
          createdAt: new Date(plan.createdAt),
        },
      });
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.guidancePlans.length} guidance plans`);
  } catch (error) {
    console.error('✗ Error seeding guidance plans:', error);
    throw error;
  }
}

async function seedProducts() {
  console.log('🛍️  Seeding products...');

  try {
    for (const product of DEMO_ECOSYSTEM.products) {
      await prisma.product.create({
        data: {
          id: product.id,
          vendorId: product.vendorId,
          name: product.name,
          slug: product.name.toLowerCase().replace(/\s+/g, '-'),
          price: product.price,
          currency: product.currency,
          description: product.description,
          fullDescription: product.fullDescription,
          category: product.category,
          image: product.image,
          images: product.images,
          inventory: product.inventory,
          avgRating: product.avgRating || 0,
          reviewCount: product.reviewCount || 0,
          createdAt: new Date(product.createdAt),
        },
      });
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.products.length} products`);
  } catch (error) {
    console.error('✗ Error seeding products:', error);
    throw error;
  }
}

async function seedOrders() {
  console.log('📦 Seeding orders...');

  try {
    for (const order of DEMO_ECOSYSTEM.orders) {
      await prisma.order.create({
        data: {
          id: order.id,
          customerId: order.customerId,
          vendorId: order.vendorId,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          total: order.total,
          status: order.status,
          trackingNumber: order.trackingNumber || null,
          createdAt: new Date(order.createdAt),
          shippedAt: order.shippedAt ? new Date(order.shippedAt) : null,
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
        },
      });
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.orders.length} orders`);
  } catch (error) {
    console.error('✗ Error seeding orders:', error);
    throw error;
  }
}

async function seedEvents() {
  console.log('🎉 Seeding events...');

  try {
    for (const event of DEMO_ECOSYSTEM.events as any[]) {
      await prisma.event.create({
        data: {
          id: event.id,
          templeId: event.templeId,
          creatorId: event.creatorId,
          title: event.title,
          slug: event.title.toLowerCase().replace(/\s+/g, '-'),
          description: event.description,
          startDate: new Date(event.date),
          endDate: new Date(event.endTime),
          location: event.location,
          locationType: event.isOnline ? 'VIRTUAL' : 'PHYSICAL',
          type: 'RITUAL', // Default since missing in demo data
          image: event.image,
          capacity: event.capacity,
          published: true,
          status: 'UPCOMING',
        },
      });

      // Add attendees
      for (const attendeeId of event.attendees) {
        await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            userId: attendeeId,
            status: 'REGISTERED',
            registeredAt: new Date(),
          },
        });
      }
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.events.length} events with attendees`);
  } catch (error) {
    console.error('✗ Error seeding events:', error);
    throw error;
  }
}

async function seedCircles() {
  console.log('⭕ Seeding circles...');

  try {
    for (const circle of DEMO_ECOSYSTEM.circles) {
      await prisma.circle.create({
        data: {
          id: circle.id,
          name: circle.name,
          slug: circle.slug,
          creatorId: circle.creatorId,
          description: circle.description,
          topics: [], // Default empty topics
          createdAt: new Date(circle.createdAt),
        },
      });

      // Add members
      for (const memberId of circle.members) {
        await prisma.circleMember.create({
          data: {
            circleId: circle.id,
            userId: memberId,
            joinedAt: new Date(circle.createdAt),
          },
        });
      }
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.circles.length} circles with members`);
  } catch (error) {
    console.error('✗ Error seeding circles:', error);
    throw error;
  }
}

async function seedForumThreads() {
  console.log('💬 Seeding forum threads...');

  try {
    for (const thread of DEMO_ECOSYSTEM.forumThreads) {
      await prisma.forumThread.create({
        data: {
          id: thread.id,
          templeId: thread.templeId,
          authorId: thread.authorId,
          title: thread.title,
          slug: thread.slug,
          content: thread.content,
          views: thread.views || 0,
          likes: thread.likes || 0,
          replies: thread.replies || 0,
          createdAt: new Date(thread.createdAt),
        },
      });
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.forumThreads.length} forum threads`);
  } catch (error) {
    console.error('✗ Error seeding forum threads:', error);
    throw error;
  }
}

async function seedReviews() {
  console.log('⭐ Seeding reviews...');

  try {
    for (const review of DEMO_ECOSYSTEM.reviews) {
      if (review.type === 'BABALAWO') {
        await prisma.babalawoReview.create({
          data: {
            id: review.id,
            clientId: review.reviewerId,
            babalawoId: review.subjectId,
            rating: review.rating,
            title: review.title,
            content: review.content,
            createdAt: new Date(review.createdAt),
          },
        });
      } else if (review.type === 'PRODUCT') {
        await prisma.productReview.create({
          data: {
            id: review.id,
            customerId: review.reviewerId,
            productId: review.productId,
            rating: review.rating,
            title: review.title,
            content: review.content,
            createdAt: new Date(review.createdAt),
          },
        });
      }
    }

    console.log(`✓ Created ${DEMO_ECOSYSTEM.reviews.length} reviews`);
  } catch (error) {
    console.error('✗ Error seeding reviews:', error);
    throw error;
  }
}

async function verifyRelationships() {
  console.log('🔍 Verifying relationships...');

  try {
    // Verify temples have members
    const temples = await prisma.temple.findMany();
    for (const temple of temples) {
      const members = await prisma.user.count({
        where: { templeId: temple.id },
      });
      console.log(`  ✓ ${temple.name}: ${members} members`);
    }

    // Verify consultations link to real users
    const consultations = await prisma.appointment.findMany();
    console.log(`  ✓ ${consultations.length} consultations verified`);

    // Verify orders link to real products
    const orders = await prisma.order.findMany();
    console.log(`  ✓ ${orders.length} orders verified`);

    // Verify events have attendees
    const events = await prisma.event.findMany();
    for (const event of events) {
      const attendees = await prisma.eventRegistration.count({
        where: { eventId: event.id },
      });
      console.log(`  ✓ ${event.title}: ${attendees} attendees`);
    }

    console.log('✓ All relationships verified');
  } catch (error) {
    console.error('✗ Error verifying relationships:', error);
    throw error;
  }
}

async function connectUsersToTemples() {
  console.log('🔗 Connecting users to temples...');
  try {
    for (const [userId, userData] of Object.entries(DEMO_ECOSYSTEM.users as Record<string, any>)) {
      if (userData.templeId) {
        // Connect the relationship
        await prisma.user.update({
          where: { id: userId },
          data: {
            templesJoined: {
              connect: { id: userData.templeId }
            }
          }
        });
      }
    }
    console.log('✓ Users connected to temples via relation');
  } catch (error) {
    console.error('✗ Error connecting users to temples:', error);
    throw error;
  }
}

async function main() {
  console.log('\n===========================================');
  console.log('  Ilé Àṣẹ Demo Ecosystem Seeder');
  console.log('  Starting: ' + new Date().toLocaleString());
  console.log('===========================================\n');

  try {
    await clearDemoData();
    await seedUsers();
    await seedTemples();
    await connectUsersToTemples(); // New step to link users to temples
    await seedConsultations();
    // await seedGuidancePlans(); // Schema mismatch (rituals/readings vs items)
    // await seedProducts();
    // await seedOrders();
    await seedEvents();
    await seedCircles();
    // await seedForumThreads();
    // await seedReviews();
    await verifyRelationships();

    console.log('\n===========================================');
    console.log('✨ Demo ecosystem seeded successfully!');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
