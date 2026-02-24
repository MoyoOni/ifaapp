/**
 * PB-201.2 Integration tests for database relationships.
 * Verifies 50+ critical Prisma model relations by creating data and asserting includes.
 * Run with: npm test -- db-relationships.integration.spec
 * Requires DATABASE_URL to be set (skips when missing).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hasDb = !!process.env.DATABASE_URL;

function uid(): string {
  return `int-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const describeSuite = hasDb ? describe : describe.skip;

describeSuite('DB Relationships Integration (PB-201.2)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('User -> SocialLink (1)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: 'Int Test User',
          passwordHash: 'hash',
          role: 'CLIENT',
        },
      });
      const link = await tx.socialLink.create({
        data: { userId: user.id, platform: 'twitter', url: 'https://x.com/test' },
      });
      const found = await tx.user.findUnique({
        where: { id: user.id },
        include: { socialLinks: true },
      });
      expect(found?.socialLinks).toHaveLength(1);
      expect(found?.socialLinks[0].platform).toBe('twitter');
      await tx.socialLink.delete({ where: { id: link.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('User -> Certificate (2)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'Int Test', passwordHash: 'hash', role: 'BABALAWO' },
      });
      const cert = await tx.certificate.create({
        data: { userId: user.id, title: 'T', issuer: 'I', date: '2025-01-01', tier: 'JUNIOR' },
      });
      const found = await tx.user.findUnique({
        where: { id: user.id },
        include: { certificates: true },
      });
      expect(found?.certificates).toHaveLength(1);
      await tx.certificate.delete({ where: { id: cert.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Appointment -> babalawo, client (3,4)', async () => {
    const id = uid();
    const e1 = `b-${id}@int.test`;
    const e2 = `c-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const babalawo = await tx.user.create({
        data: { email: e1, name: 'Baba', passwordHash: 'h', role: 'BABALAWO' },
      });
      const client = await tx.user.create({
        data: { email: e2, name: 'Client', passwordHash: 'h', role: 'CLIENT' },
      });
      const appt = await tx.appointment.create({
        data: {
          babalawoId: babalawo.id,
          clientId: client.id,
          date: '2026-12-01',
          time: '10:00',
        },
      });
      const found = await tx.appointment.findUnique({
        where: { id: appt.id },
        include: { babalawo: true, client: true },
      });
      expect(found?.babalawo?.email).toBe(e1);
      expect(found?.client?.email).toBe(e2);
      await tx.appointment.delete({ where: { id: appt.id } });
      await tx.user.delete({ where: { id: client.id } });
      await tx.user.delete({ where: { id: babalawo.id } });
    });
  });

  it('User -> appointmentsAsClient, appointmentsAsBabalawo (5,6)', async () => {
    const id = uid();
    const e1 = `b-${id}@int.test`;
    const e2 = `c-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const babalawo = await tx.user.create({
        data: { email: e1, name: 'B', passwordHash: 'h', role: 'BABALAWO' },
      });
      const client = await tx.user.create({
        data: { email: e2, name: 'C', passwordHash: 'h', role: 'CLIENT' },
      });
      await tx.appointment.create({
        data: {
          babalawoId: babalawo.id,
          clientId: client.id,
          date: '2026-12-01',
          time: '10:00',
        },
      });
      const withApptsAsB = await tx.user.findUnique({
        where: { id: babalawo.id },
        include: { appointmentsAsBabalawo: true },
      });
      const withApptsAsC = await tx.user.findUnique({
        where: { id: client.id },
        include: { appointmentsAsClient: true },
      });
      expect(withApptsAsB?.appointmentsAsBabalawo).toHaveLength(1);
      expect(withApptsAsC?.appointmentsAsClient).toHaveLength(1);
      await tx.appointment.deleteMany({ where: { clientId: client.id } });
      await tx.user.delete({ where: { id: client.id } });
      await tx.user.delete({ where: { id: babalawo.id } });
    });
  });

  it('GuidancePlan -> appointment, babalawo, client (7,8,9)', async () => {
    const id = uid();
    const e1 = `b-${id}@int.test`;
    const e2 = `c-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const babalawo = await tx.user.create({
        data: { email: e1, name: 'B', passwordHash: 'h', role: 'BABALAWO' },
      });
      const client = await tx.user.create({
        data: { email: e2, name: 'C', passwordHash: 'h', role: 'CLIENT' },
      });
      const appt = await tx.appointment.create({
        data: {
          babalawoId: babalawo.id,
          clientId: client.id,
          date: '2026-12-01',
          time: '10:00',
        },
      });
      const gp = await tx.guidancePlan.create({
        data: {
          appointmentId: appt.id,
          babalawoId: babalawo.id,
          clientId: client.id,
          type: 'AKOSE',
          items: [],
          totalCost: 100,
        },
      });
      const found = await tx.guidancePlan.findUnique({
        where: { id: gp.id },
        include: { appointment: true, babalawo: true, client: true },
      });
      expect(found?.appointment?.id).toBe(appt.id);
      expect(found?.babalawo?.id).toBe(babalawo.id);
      expect(found?.client?.id).toBe(client.id);
      await tx.guidancePlan.delete({ where: { id: gp.id } });
      await tx.appointment.delete({ where: { id: appt.id } });
      await tx.user.delete({ where: { id: client.id } });
      await tx.user.delete({ where: { id: babalawo.id } });
    });
  });

  it('User -> guidancePlansReceived, guidancePlansCreated (10,11)', async () => {
    const id = uid();
    const e1 = `b-${id}@int.test`;
    const e2 = `c-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const babalawo = await tx.user.create({
        data: { email: e1, name: 'B', passwordHash: 'h', role: 'BABALAWO' },
      });
      const client = await tx.user.create({
        data: { email: e2, name: 'C', passwordHash: 'h', role: 'CLIENT' },
      });
      const appt = await tx.appointment.create({
        data: {
          babalawoId: babalawo.id,
          clientId: client.id,
          date: '2026-12-01',
          time: '10:00',
        },
      });
      await tx.guidancePlan.create({
        data: {
          appointmentId: appt.id,
          babalawoId: babalawo.id,
          clientId: client.id,
          type: 'AKOSE',
          items: [],
          totalCost: 100,
        },
      });
      const bWithCreated = await tx.user.findUnique({
        where: { id: babalawo.id },
        include: { guidancePlansCreated: true },
      });
      const cWithReceived = await tx.user.findUnique({
        where: { id: client.id },
        include: { guidancePlansReceived: true },
      });
      expect(bWithCreated?.guidancePlansCreated).toHaveLength(1);
      expect(cWithReceived?.guidancePlansReceived).toHaveLength(1);
      await tx.guidancePlan.deleteMany({ where: { clientId: client.id } });
      await tx.appointment.deleteMany({ where: { clientId: client.id } });
      await tx.user.delete({ where: { id: client.id } });
      await tx.user.delete({ where: { id: babalawo.id } });
    });
  });

  it('ForumCategory -> ForumThread; ForumThread -> author, category, posts (12,13,14)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const cat = await tx.forumCategory.create({
        data: { name: 'Int Cat', slug: `slug-${id}` },
      });
      const user = await tx.user.create({
        data: { email, name: 'Author', passwordHash: 'h', role: 'CLIENT' },
      });
      const thread = await tx.forumThread.create({
        data: {
          categoryId: cat.id,
          authorId: user.id,
          title: 'T',
          content: 'C',
        },
      });
      const post = await tx.forumPost.create({
        data: { threadId: thread.id, authorId: user.id, content: 'P' },
      });
      const foundThread = await tx.forumThread.findUnique({
        where: { id: thread.id },
        include: { category: true, author: true, posts: true },
      });
      expect(foundThread?.category?.slug).toBe(cat.slug);
      expect(foundThread?.author?.id).toBe(user.id);
      expect(foundThread?.posts).toHaveLength(1);
      await tx.postAcknowledgment.deleteMany({ where: { postId: post.id } });
      await tx.forumPost.delete({ where: { id: post.id } });
      await tx.forumThread.delete({ where: { id: thread.id } });
      await tx.user.delete({ where: { id: user.id } });
      await tx.forumCategory.delete({ where: { id: cat.id } });
    });
  });

  it('ForumPost -> thread, author (15,16)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const cat = await tx.forumCategory.create({
        data: { name: 'Cat', slug: `s-${id}` },
      });
      const user = await tx.user.create({
        data: { email, name: 'U', passwordHash: 'h', role: 'CLIENT' },
      });
      const thread = await tx.forumThread.create({
        data: { categoryId: cat.id, authorId: user.id, title: 'T', content: 'C' },
      });
      const post = await tx.forumPost.create({
        data: { threadId: thread.id, authorId: user.id, content: 'P' },
      });
      const found = await tx.forumPost.findUnique({
        where: { id: post.id },
        include: { thread: true, author: true },
      });
      expect(found?.thread?.id).toBe(thread.id);
      expect(found?.author?.id).toBe(user.id);
      await tx.forumPost.delete({ where: { id: post.id } });
      await tx.forumThread.delete({ where: { id: thread.id } });
      await tx.user.delete({ where: { id: user.id } });
      await tx.forumCategory.delete({ where: { id: cat.id } });
    });
  });

  it('User -> Vendor; Vendor -> user, products (17,18,19)', async () => {
    const id = uid();
    const email = `v-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'Vendor User', passwordHash: 'h', role: 'VENDOR' },
      });
      const vendor = await tx.vendor.create({
        data: { userId: user.id, businessName: 'Int Vendor' },
      });
      const product = await tx.product.create({
        data: {
          vendorId: vendor.id,
          name: 'P',
          description: 'D',
          price: 10,
          category: 'OTHER',
          status: 'ACTIVE',
        },
      });
      const foundVendor = await tx.vendor.findUnique({
        where: { id: vendor.id },
        include: { user: true, products: true },
      });
      expect(foundVendor?.user?.id).toBe(user.id);
      expect(foundVendor?.products).toHaveLength(1);
      await tx.product.delete({ where: { id: product.id } });
      await tx.vendor.delete({ where: { id: vendor.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Order -> customer, vendor, items; OrderItem -> order, product (20,21,22,23,24)', async () => {
    const id = uid();
    const e1 = `c-${id}@int.test`;
    const e2 = `v-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const customer = await tx.user.create({
        data: { email: e1, name: 'C', passwordHash: 'h', role: 'CLIENT' },
      });
      const vendorUser = await tx.user.create({
        data: { email: e2, name: 'V', passwordHash: 'h', role: 'VENDOR' },
      });
      const vendor = await tx.vendor.create({
        data: { userId: vendorUser.id, businessName: 'V Biz' },
      });
      const product = await tx.product.create({
        data: {
          vendorId: vendor.id,
          name: 'Prod',
          description: 'D',
          price: 100,
          category: 'OTHER',
          status: 'ACTIVE',
        },
      });
      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          vendorId: vendor.id,
          totalAmount: 100,
        },
      });
      const item = await tx.orderItem.create({
        data: { orderId: order.id, productId: product.id, quantity: 1, price: 100 },
      });
      const foundOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { customer: true, vendor: true, items: true },
      });
      expect(foundOrder?.customer?.id).toBe(customer.id);
      expect(foundOrder?.vendor?.id).toBe(vendor.id);
      expect(foundOrder?.items).toHaveLength(1);
      const foundItem = await tx.orderItem.findUnique({
        where: { id: item.id },
        include: { order: true, product: true },
      });
      expect(foundItem?.order?.id).toBe(order.id);
      expect(foundItem?.product?.id).toBe(product.id);
      await tx.orderItem.delete({ where: { id: item.id } });
      await tx.order.delete({ where: { id: order.id } });
      await tx.product.delete({ where: { id: product.id } });
      await tx.vendor.delete({ where: { id: vendor.id } });
      await tx.user.delete({ where: { id: vendorUser.id } });
      await tx.user.delete({ where: { id: customer.id } });
    });
  });

  it('User -> userWallet (Wallet); Wallet -> user, transactions (25,26,27)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'U', passwordHash: 'h', role: 'CLIENT' },
      });
      const wallet = await tx.wallet.create({
        data: { userId: user.id },
      });
      const txRecord = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: 'DEPOSIT',
          amount: 50,
          status: 'COMPLETED',
        },
      });
      const foundWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
        include: { user: true, transactions: true },
      });
      expect(foundWallet?.user?.id).toBe(user.id);
      expect(foundWallet?.transactions).toHaveLength(1);
      const foundUser = await tx.user.findUnique({
        where: { id: user.id },
        include: { userWallet: true },
      });
      expect(foundUser?.userWallet?.id).toBe(wallet.id);
      await tx.transaction.delete({ where: { id: txRecord.id } });
      await tx.wallet.delete({ where: { id: wallet.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Transaction -> wallet, user (28,29)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'U', passwordHash: 'h', role: 'CLIENT' },
      });
      const wallet = await tx.wallet.create({ data: { userId: user.id } });
      const txRecord = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: 'DEPOSIT',
          amount: 10,
          status: 'COMPLETED',
        },
      });
      const found = await tx.transaction.findUnique({
        where: { id: txRecord.id },
        include: { wallet: true, user: true },
      });
      expect(found?.wallet?.id).toBe(wallet.id);
      expect(found?.user?.id).toBe(user.id);
      await tx.transaction.delete({ where: { id: txRecord.id } });
      await tx.wallet.delete({ where: { id: wallet.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('User -> Payment; Payment -> user (30,31)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'U', passwordHash: 'h', role: 'CLIENT' },
      });
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          transactionId: `tx-${id}`,
          amount: 100,
          purpose: 'WALLET_TOPUP',
          provider: 'PAYSTACK',
        },
      });
      const found = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { user: true },
      });
      expect(found?.user?.id).toBe(user.id);
      await tx.payment.delete({ where: { id: payment.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Temple -> founder, followers; TempleFollow -> user, temple (32,33,34,35)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    const slug = `temple-${id}`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'Founder', passwordHash: 'h', role: 'BABALAWO' },
      });
      const temple = await tx.temple.create({
        data: {
          name: 'Int Temple',
          slug,
          founderId: user.id,
        },
      });
      const follow = await tx.templeFollow.create({
        data: { userId: user.id, templeId: temple.id },
      });
      const foundTemple = await tx.temple.findUnique({
        where: { id: temple.id },
        include: { founder: true, followers: true },
      });
      expect(foundTemple?.founder?.id).toBe(user.id);
      expect(foundTemple?.followers).toHaveLength(1);
      const foundFollow = await tx.templeFollow.findUnique({
        where: { id: follow.id },
        include: { user: true, temple: true },
      });
      expect(foundFollow?.user?.id).toBe(user.id);
      expect(foundFollow?.temple?.id).toBe(temple.id);
      await tx.templeFollow.delete({ where: { id: follow.id } });
      await tx.temple.delete({ where: { id: temple.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Course -> instructor, lessons; Lesson -> course (36,37,38)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    const slug = `course-${id}`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'Instructor', passwordHash: 'h', role: 'BABALAWO' },
      });
      const course = await tx.course.create({
        data: {
          instructorId: user.id,
          title: 'C',
          slug,
          description: 'D',
          category: 'foundational',
          price: 0,
        },
      });
      const lesson = await tx.lesson.create({
        data: { courseId: course.id, title: 'L', order: 1, resources: [] },
      });
      const foundCourse = await tx.course.findUnique({
        where: { id: course.id },
        include: { instructor: true, lessons: true },
      });
      expect(foundCourse?.instructor?.id).toBe(user.id);
      expect(foundCourse?.lessons).toHaveLength(1);
      const foundLesson = await tx.lesson.findUnique({
        where: { id: lesson.id },
        include: { course: true },
      });
      expect(foundLesson?.course?.id).toBe(course.id);
      await tx.lesson.delete({ where: { id: lesson.id } });
      await tx.course.delete({ where: { id: course.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Circle -> creator, members; CircleMember -> circle, user (39,40,41,42)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    const slug = `circle-${id}`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'Creator', passwordHash: 'h', role: 'CLIENT' },
      });
      const circle = await tx.circle.create({
        data: { name: 'Circle', slug, creatorId: user.id },
      });
      const member = await tx.circleMember.create({
        data: { circleId: circle.id, userId: user.id },
      });
      const foundCircle = await tx.circle.findUnique({
        where: { id: circle.id },
        include: { creator: true, members: true },
      });
      expect(foundCircle?.creator?.id).toBe(user.id);
      expect(foundCircle?.members).toHaveLength(1);
      const foundMember = await tx.circleMember.findUnique({
        where: { id: member.id },
        include: { circle: true, user: true },
      });
      expect(foundMember?.circle?.id).toBe(circle.id);
      expect(foundMember?.user?.id).toBe(user.id);
      await tx.circleMember.delete({ where: { id: member.id } });
      await tx.circle.delete({ where: { id: circle.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });

  it('Escrow -> wallet, user; GuidancePlan -> escrow (43,44,45)', async () => {
    const id = uid();
    const e1 = `b-${id}@int.test`;
    const e2 = `c-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const babalawo = await tx.user.create({
        data: { email: e1, name: 'B', passwordHash: 'h', role: 'BABALAWO' },
      });
      const client = await tx.user.create({
        data: { email: e2, name: 'C', passwordHash: 'h', role: 'CLIENT' },
      });
      const wallet = await tx.wallet.create({ data: { userId: client.id } });
      const appt = await tx.appointment.create({
        data: {
          babalawoId: babalawo.id,
          clientId: client.id,
          date: '2026-12-01',
          time: '10:00',
        },
      });
      const escrow = await tx.escrow.create({
        data: {
          userId: client.id,
          walletId: wallet.id,
          amount: 100,
          type: 'GUIDANCE_PLAN',
          relatedId: appt.id,
        },
      });
      const gp = await tx.guidancePlan.create({
        data: {
          appointmentId: appt.id,
          babalawoId: babalawo.id,
          clientId: client.id,
          type: 'AKOSE',
          items: [],
          totalCost: 100,
          escrowId: escrow.id,
        },
      });
      const foundEscrow = await tx.escrow.findUnique({
        where: { id: escrow.id },
        include: { wallet: true, user: true, guidancePlan: true },
      });
      expect(foundEscrow?.wallet?.id).toBe(wallet.id);
      expect(foundEscrow?.user?.id).toBe(client.id);
      expect(foundEscrow?.guidancePlan?.id).toBe(gp.id);
      await tx.guidancePlan.update({ where: { id: gp.id }, data: { escrowId: null } });
      await tx.guidancePlan.delete({ where: { id: gp.id } });
      await tx.escrow.delete({ where: { id: escrow.id } });
      await tx.appointment.delete({ where: { id: appt.id } });
      await tx.wallet.delete({ where: { id: wallet.id } });
      await tx.user.delete({ where: { id: client.id } });
      await tx.user.delete({ where: { id: babalawo.id } });
    });
  });

  it('Dispute -> complainant, respondent (46,47)', async () => {
    const id = uid();
    const e1 = `a-${id}@int.test`;
    const e2 = `b-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const complainant = await tx.user.create({
        data: { email: e1, name: 'A', passwordHash: 'h', role: 'CLIENT' },
      });
      const respondent = await tx.user.create({
        data: { email: e2, name: 'B', passwordHash: 'h', role: 'VENDOR' },
      });
      const dispute = await tx.dispute.create({
        data: {
          complainantId: complainant.id,
          respondentId: respondent.id,
          type: 'OTHER',
          category: 'OTHER',
          title: 'T',
          description: 'D',
        },
      });
      const found = await tx.dispute.findUnique({
        where: { id: dispute.id },
        include: { complainant: true, respondent: true },
      });
      expect(found?.complainant?.id).toBe(complainant.id);
      expect(found?.respondent?.id).toBe(respondent.id);
      await tx.dispute.delete({ where: { id: dispute.id } });
      await tx.user.delete({ where: { id: respondent.id } });
      await tx.user.delete({ where: { id: complainant.id } });
    });
  });

  it('Message -> sender, receiver (48,49)', async () => {
    const id = uid();
    const e1 = `s-${id}@int.test`;
    const e2 = `r-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const sender = await tx.user.create({
        data: { email: e1, name: 'S', passwordHash: 'h', role: 'CLIENT' },
      });
      const receiver = await tx.user.create({
        data: { email: e2, name: 'R', passwordHash: 'h', role: 'BABALAWO' },
      });
      const msg = await tx.message.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          content: 'Hello',
        },
      });
      const found = await tx.message.findUnique({
        where: { id: msg.id },
        include: { sender: true, receiver: true },
      });
      expect(found?.sender?.id).toBe(sender.id);
      expect(found?.receiver?.id).toBe(receiver.id);
      await tx.message.delete({ where: { id: msg.id } });
      await tx.user.delete({ where: { id: receiver.id } });
      await tx.user.delete({ where: { id: sender.id } });
    });
  });

  it('BabalawoClient -> babalawo, client (50,51)', async () => {
    const id = uid();
    const e1 = `b-${id}@int.test`;
    const e2 = `c-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const babalawo = await tx.user.create({
        data: { email: e1, name: 'B', passwordHash: 'h', role: 'BABALAWO' },
      });
      const client = await tx.user.create({
        data: { email: e2, name: 'C', passwordHash: 'h', role: 'CLIENT' },
      });
      const bc = await tx.babalawoClient.create({
        data: { babalawoId: babalawo.id, clientId: client.id },
      });
      const found = await tx.babalawoClient.findUnique({
        where: { id: bc.id },
        include: { babalawo: true, client: true },
      });
      expect(found?.babalawo?.id).toBe(babalawo.id);
      expect(found?.client?.id).toBe(client.id);
      await tx.babalawoClient.delete({ where: { id: bc.id } });
      await tx.user.delete({ where: { id: client.id } });
      await tx.user.delete({ where: { id: babalawo.id } });
    });
  });

  it('WithdrawalRequest -> user, escrow (52,53)', async () => {
    const id = uid();
    const email = `u-${id}@int.test`;
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: 'U', passwordHash: 'h', role: 'BABALAWO' },
      });
      const wallet = await tx.wallet.create({ data: { userId: user.id } });
      const escrow = await tx.escrow.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          amount: 100,
          type: 'BOOKING',
        },
      });
      const wr = await tx.withdrawalRequest.create({
        data: { userId: user.id, escrowId: escrow.id, amount: 50 },
      });
      const found = await tx.withdrawalRequest.findUnique({
        where: { id: wr.id },
        include: { user: true, escrow: true },
      });
      expect(found?.user?.id).toBe(user.id);
      expect(found?.escrow?.id).toBe(escrow.id);
      await tx.withdrawalRequest.delete({ where: { id: wr.id } });
      await tx.escrow.delete({ where: { id: escrow.id } });
      await tx.wallet.delete({ where: { id: wallet.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
  });
});
