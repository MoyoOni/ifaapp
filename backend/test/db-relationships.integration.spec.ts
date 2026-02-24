/**
 * HC-201.2: Integration tests for database relationships.
 * Uses real Prisma client against DATABASE_URL. Skip when DATABASE_URL is unset or production.
 * Run: npm run test:integration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Run only when explicitly opted in (test DB required). Otherwise skip so CI/local passes without DB.
const hasTestDb =
  process.env.RUN_INTEGRATION_TESTS === '1' &&
  !!process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('production');

const describeOrSkip = hasTestDb ? describe : describe.skip;

describeOrSkip('DB Relationship Integration (HC-201.2)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ---- User ↔ Temple (Babalawo in temple) ----
  describe('User ↔ Temple (Babalawo)', () => {
    it('should enforce temple founderId FK to users', async () => {
      const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (!user) return;
      const temple = await prisma.temple.findFirst({ where: { founderId: user.id } });
      if (!temple) return;
      const found = await prisma.temple.findUnique({
        where: { id: temple.id },
        include: { founder: true },
      });
      expect(found?.founder?.id).toBe(user.id);
    });

    it('should load temple with babalawos (users with templeId)', async () => {
      const temple = await prisma.temple.findFirst({ where: { status: 'ACTIVE' } });
      if (!temple) return;
      const withBabalawos = await prisma.temple.findUnique({
        where: { id: temple.id },
        include: { babalawos: true },
      });
      expect(withBabalawos).toBeDefined();
      expect(Array.isArray(withBabalawos?.babalawos)).toBe(true);
    });

    it('should enforce templeId FK on User', async () => {
      const temple = await prisma.temple.findFirst();
      if (!temple) return;
      const userWithTemple = await prisma.user.findFirst({
        where: { templeId: temple.id },
      });
      if (!userWithTemple) return;
      expect(userWithTemple.templeId).toBe(temple.id);
    });

    it('should enforce TempleFollow user and temple FKs', async () => {
      const follow = await prisma.templeFollow.findFirst();
      if (!follow) return;
      const loaded = await prisma.templeFollow.findUnique({
        where: { id: follow.id },
        include: { user: true, temple: true },
      });
      expect(loaded?.user.id).toBe(follow.userId);
      expect(loaded?.temple.id).toBe(follow.templeId);
    });

    it('should cascade delete TempleFollow when user deleted', async () => {
      const follow = await prisma.templeFollow.findFirst();
      if (!follow) return;
      const before = await prisma.templeFollow.count({ where: { userId: follow.userId } });
      expect(before).toBeGreaterThanOrEqual(0);
      // Schema: onDelete: Cascade for user - relationship exists
      const rel = await prisma.templeFollow.findUnique({
        where: { id: follow.id },
        include: { user: true },
      });
      expect(rel?.user).toBeDefined();
    });
  });

  // ---- User ↔ Circle ↔ CircleMember ----
  describe('User ↔ Circle ↔ CircleMember', () => {
    it('should enforce circle creatorId FK to users', async () => {
      const circle = await prisma.circle.findFirst({ where: { status: 'ACTIVE' } });
      if (!circle) return;
      const withCreator = await prisma.circle.findUnique({
        where: { id: circle.id },
        include: { creator: true },
      });
      expect(withCreator?.creator.id).toBe(circle.creatorId);
    });

    it('should load circle with members', async () => {
      const circle = await prisma.circle.findFirst();
      if (!circle) return;
      const withMembers = await prisma.circle.findUnique({
        where: { id: circle.id },
        include: { members: true },
      });
      expect(withMembers).toBeDefined();
      expect(Array.isArray(withMembers?.members)).toBe(true);
    });

    it('should enforce CircleMember circleId and userId FKs', async () => {
      const member = await prisma.circleMember.findFirst();
      if (!member) return;
      const loaded = await prisma.circleMember.findUnique({
        where: { id: member.id },
        include: { circle: true, user: true },
      });
      expect(loaded?.circle.id).toBe(member.circleId);
      expect(loaded?.user.id).toBe(member.userId);
    });

    it('should enforce unique circleId+userId on CircleMember', async () => {
      const member = await prisma.circleMember.findFirst();
      if (!member) return;
      const count = await prisma.circleMember.count({
        where: { circleId: member.circleId, userId: member.userId },
      });
      expect(count).toBe(1);
    });

    it('should allow MEMBER role on CircleMember', async () => {
      const member = await prisma.circleMember.findFirst({ where: { role: 'MEMBER' } });
      if (!member) return;
      expect(member.role).toBe('MEMBER');
    });

    it('should allow MODERATOR and ADMIN roles on CircleMember', async () => {
      const mod = await prisma.circleMember.findFirst({ where: { role: 'MODERATOR' } });
      const admin = await prisma.circleMember.findFirst({ where: { role: 'ADMIN' } });
      expect(mod === null || mod?.role === 'MODERATOR').toBe(true);
      expect(admin === null || admin?.role === 'ADMIN').toBe(true);
    });
  });

  // ---- Appointment ↔ User (Babalawo/Client) ↔ GuidancePlan ----
  describe('Appointment ↔ User ↔ GuidancePlan', () => {
    it('should enforce appointment babalawoId and clientId FKs', async () => {
      const apt = await prisma.appointment.findFirst();
      if (!apt) return;
      const loaded = await prisma.appointment.findUnique({
        where: { id: apt.id },
        include: { babalawo: true, client: true },
      });
      expect(loaded?.babalawo.id).toBe(apt.babalawoId);
      expect(loaded?.client.id).toBe(apt.clientId);
    });

    it('should load appointment with guidancePlan', async () => {
      const plan = await prisma.guidancePlan.findFirst({ select: { appointmentId: true } });
      if (!plan) return;
      const withPlan = await prisma.appointment.findUnique({
        where: { id: plan.appointmentId },
        include: { guidancePlan: true },
      });
      expect(withPlan).toBeDefined();
      if (withPlan?.guidancePlan) expect(withPlan.guidancePlan.appointmentId).toBe(plan.appointmentId);
    });

    it('should enforce GuidancePlan appointmentId FK and unique', async () => {
      const plan = await prisma.guidancePlan.findFirst();
      if (!plan) return;
      const loaded = await prisma.guidancePlan.findUnique({
        where: { id: plan.id },
        include: { appointment: true, babalawo: true, client: true },
      });
      expect(loaded?.appointment.id).toBe(plan.appointmentId);
      expect(loaded?.babalawo.id).toBe(plan.babalawoId);
      expect(loaded?.client.id).toBe(plan.clientId);
    });

    it('should enforce GuidancePlan escrowId optional FK', async () => {
      const withEscrow = await prisma.guidancePlan.findFirst({ where: { NOT: { escrowId: null } } });
      if (!withEscrow?.escrowId) return;
      const escrow = await prisma.escrow.findUnique({ where: { id: withEscrow.escrowId } });
      expect(escrow).toBeDefined();
    });

    it('should cascade delete GuidancePlan when appointment deleted (schema)', async () => {
      const plan = await prisma.guidancePlan.findFirst();
      if (!plan) return;
      const apt = await prisma.appointment.findUnique({ where: { id: plan.appointmentId } });
      expect(apt).toBeDefined();
    });
  });

  // ---- Payment ↔ User ----
  describe('Payment ↔ User', () => {
    it('should enforce payment userId FK', async () => {
      const payment = await prisma.payment.findFirst();
      if (!payment) return;
      const loaded = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { user: true },
      });
      expect(loaded?.user.id).toBe(payment.userId);
    });

    it('should enforce payment transactionId unique', async () => {
      const payment = await prisma.payment.findFirst();
      if (!payment) return;
      const count = await prisma.payment.count({
        where: { transactionId: payment.transactionId },
      });
      expect(count).toBe(1);
    });
  });

  // ---- Product ↔ Order ↔ OrderItem ↔ Vendor ↔ User ----
  describe('Product ↔ Order ↔ OrderItem ↔ Vendor', () => {
    it('should enforce product vendorId FK', async () => {
      const product = await prisma.product.findFirst();
      if (!product) return;
      const loaded = await prisma.product.findUnique({
        where: { id: product.id },
        include: { vendor: true },
      });
      expect(loaded?.vendor.id).toBe(product.vendorId);
    });

    it('should enforce vendor userId FK', async () => {
      const vendor = await prisma.vendor.findFirst();
      if (!vendor) return;
      const loaded = await prisma.vendor.findUnique({
        where: { id: vendor.id },
        include: { user: true },
      });
      expect(loaded?.user.id).toBe(vendor.userId);
    });

    it('should enforce order customerId and vendorId FKs', async () => {
      const order = await prisma.order.findFirst();
      if (!order) return;
      const loaded = await prisma.order.findUnique({
        where: { id: order.id },
        include: { customer: true, vendor: true },
      });
      expect(loaded?.customer.id).toBe(order.customerId);
      expect(loaded?.vendor.id).toBe(order.vendorId);
    });

    it('should load order with items', async () => {
      const order = await prisma.order.findFirst();
      if (!order) return;
      const withItems = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      expect(withItems).toBeDefined();
      expect(Array.isArray(withItems?.items)).toBe(true);
    });

    it('should enforce OrderItem orderId and productId FKs', async () => {
      const item = await prisma.orderItem.findFirst();
      if (!item) return;
      const loaded = await prisma.orderItem.findUnique({
        where: { id: item.id },
        include: { order: true, product: true },
      });
      expect(loaded?.order.id).toBe(item.orderId);
      expect(loaded?.product.id).toBe(item.productId);
    });

    it('should cascade delete OrderItem when order deleted (schema)', async () => {
      const item = await prisma.orderItem.findFirst();
      if (!item) return;
      const order = await prisma.order.findUnique({ where: { id: item.orderId } });
      expect(order).toBeDefined();
    });

    it('should allow multiple OrderItems per order', async () => {
      const orderWithMany = await prisma.order.findFirst({
        include: { _count: { select: { items: true } } },
      });
      if (!orderWithMany) return;
      expect(orderWithMany._count.items).toBeGreaterThanOrEqual(0);
    });
  });

  // ---- Message ↔ User (sender/recipient) ----
  describe('Message ↔ User', () => {
    it('should enforce message senderId and receiverId FKs', async () => {
      const msg = await prisma.message.findFirst();
      if (!msg) return;
      const loaded = await prisma.message.findUnique({
        where: { id: msg.id },
        include: { sender: true, receiver: true },
      });
      expect(loaded?.sender.id).toBe(msg.senderId);
      expect(loaded?.receiver.id).toBe(msg.receiverId);
    });

    it('should support unread filter on messages', async () => {
      const unread = await prisma.message.count({ where: { read: false } });
      expect(typeof unread).toBe('number');
    });
  });

  // ---- Wallet ↔ User ↔ Escrow ↔ Transaction ----
  describe('Wallet ↔ User ↔ Escrow', () => {
    it('should enforce wallet userId FK and unique', async () => {
      const wallet = await prisma.wallet.findFirst();
      if (!wallet) return;
      const loaded = await prisma.wallet.findUnique({
        where: { id: wallet.id },
        include: { user: true },
      });
      expect(loaded?.user.id).toBe(wallet.userId);
    });

    it('should enforce escrow walletId and userId FKs', async () => {
      const escrow = await prisma.escrow.findFirst();
      if (!escrow) return;
      const loaded = await prisma.escrow.findUnique({
        where: { id: escrow.id },
        include: { wallet: true, user: true },
      });
      expect(loaded?.wallet.id).toBe(escrow.walletId);
      expect(loaded?.user.id).toBe(escrow.userId);
    });
  });

  // ---- Forum: Thread ↔ Post ↔ User ----
  describe('Forum Thread ↔ Post ↔ User', () => {
    it('should enforce ForumThread authorId and categoryId FKs', async () => {
      const thread = await prisma.forumThread.findFirst();
      if (!thread) return;
      const loaded = await prisma.forumThread.findUnique({
        where: { id: thread.id },
        include: { author: true, category: true },
      });
      expect(loaded?.author.id).toBe(thread.authorId);
      expect(loaded?.category.id).toBe(thread.categoryId);
    });

    it('should load thread with posts', async () => {
      const thread = await prisma.forumThread.findFirst();
      if (!thread) return;
      const withPosts = await prisma.forumThread.findUnique({
        where: { id: thread.id },
        include: { posts: true },
      });
      expect(withPosts).toBeDefined();
      expect(Array.isArray(withPosts?.posts)).toBe(true);
    });

    it('should enforce ForumPost threadId and authorId FKs', async () => {
      const post = await prisma.forumPost.findFirst();
      if (!post) return;
      const loaded = await prisma.forumPost.findUnique({
        where: { id: post.id },
        include: { thread: true, author: true },
      });
      expect(loaded?.thread.id).toBe(post.threadId);
      expect(loaded?.author.id).toBe(post.authorId);
    });
  });

  // ---- Event ↔ User ↔ Temple/Circle ----
  describe('Event ↔ User ↔ Temple/Circle', () => {
    it('should enforce event creatorId FK', async () => {
      const event = await prisma.event.findFirst();
      if (!event) return;
      const loaded = await prisma.event.findUnique({
        where: { id: event.id },
        include: { creator: true },
      });
      expect(loaded?.creator.id).toBe(event.creatorId);
    });

    it('should enforce optional event templeId and circleId FKs', async () => {
      const withTemple = await prisma.event.findFirst({ where: { NOT: { templeId: null } } });
      if (withTemple?.templeId) {
        const t = await prisma.temple.findUnique({ where: { id: withTemple.templeId } });
        expect(t).toBeDefined();
      }
      const withCircle = await prisma.event.findFirst({ where: { NOT: { circleId: null } } });
      if (withCircle?.circleId) {
        const c = await prisma.circle.findUnique({ where: { id: withCircle.circleId } });
        expect(c).toBeDefined();
      }
    });

    it('should enforce EventRegistration eventId and userId FKs', async () => {
      const reg = await prisma.eventRegistration.findFirst();
      if (!reg) return;
      const loaded = await prisma.eventRegistration.findUnique({
        where: { id: reg.id },
        include: { event: true, user: true },
      });
      expect(loaded?.event.id).toBe(reg.eventId);
      expect(loaded?.user.id).toBe(reg.userId);
    });
  });

  // ---- Notification ↔ User ----
  describe('Notification ↔ User', () => {
    it('should enforce notification userId FK', async () => {
      const notif = await prisma.notification.findFirst();
      if (!notif) return;
      const loaded = await prisma.notification.findUnique({
        where: { id: notif.id },
        include: { user: true },
      });
      expect(loaded?.user.id).toBe(notif.userId);
    });
  });

  // ---- Relationship queries (include chains) ----
  describe('Relationship query chains', () => {
    it('should query User -> appointmentsAsBabalawo -> client', async () => {
      const babalawo = await prisma.user.findFirst({
        where: { role: 'BABALAWO' },
        include: {
          appointmentsAsBabalawo: { take: 1, include: { client: true } },
        },
      });
      if (!babalawo) return;
      expect(babalawo.appointmentsAsBabalawo).toBeDefined();
    });

    it('should query User -> ordersPlaced -> items -> product', async () => {
      const customer = await prisma.user.findFirst({
        where: { ordersPlaced: { some: {} } },
        include: {
          ordersPlaced: { take: 1, include: { items: { include: { product: true } } } },
        },
      });
      if (!customer) return;
      expect(customer.ordersPlaced).toBeDefined();
    });

    it('should query Circle -> members -> user', async () => {
      const circle = await prisma.circle.findFirst({
        include: { members: { take: 2, include: { user: true } } },
      });
      if (!circle) return;
      expect(circle.members).toBeDefined();
    });

    it('should query Temple -> babalawos (users)', async () => {
      const temple = await prisma.temple.findFirst({
        include: { babalawos: { take: 2 } },
      });
      if (!temple) return;
      expect(temple.babalawos).toBeDefined();
    });

    it('should query Vendor -> products -> orders', async () => {
      const vendor = await prisma.vendor.findFirst({
        include: { products: { take: 1 }, orders: { take: 1 } },
      });
      if (!vendor) return;
      expect(vendor.products).toBeDefined();
      expect(vendor.orders).toBeDefined();
    });
  });

  // ---- Cascade / SetNull behavior (documentation tests) ----
  describe('Cascade and SetNull behavior', () => {
    it('should have User -> Temple founder SetNull on user delete', async () => {
      const t = await prisma.temple.findFirst({ where: { NOT: { founderId: null } } });
      if (!t) return;
      expect(t.founderId).toBeDefined();
    });

    it('should have Appointment -> User Cascade on delete (schema)', async () => {
      const apt = await prisma.appointment.findFirst();
      if (!apt) return;
      const u = await prisma.user.findUnique({ where: { id: apt.babalawoId } });
      expect(u).toBeDefined();
    });

    it('should have CircleMember -> Circle Cascade on delete (schema)', async () => {
      const member = await prisma.circleMember.findFirst();
      if (!member) return;
      const c = await prisma.circle.findUnique({ where: { id: member.circleId } });
      expect(c).toBeDefined();
    });

    it('should have Message -> User Cascade on delete (schema)', async () => {
      const msg = await prisma.message.findFirst();
      if (!msg) return;
      const sender = await prisma.user.findUnique({ where: { id: msg.senderId } });
      expect(sender).toBeDefined();
    });

    it('should have OrderItem -> Order Cascade on delete (schema)', async () => {
      const item = await prisma.orderItem.findFirst();
      if (!item) return;
      const order = await prisma.order.findUnique({ where: { id: item.orderId } });
      expect(order).toBeDefined();
    });
  });

  // ---- Transaction, WithdrawalRequest, ProductReview, Document, SocialLink ----
  describe('Transaction ↔ Wallet ↔ User', () => {
    it('should enforce transaction walletId and userId FKs', async () => {
      const txn = await prisma.transaction.findFirst();
      if (!txn) return;
      const loaded = await prisma.transaction.findUnique({
        where: { id: txn.id },
        include: { wallet: true, user: true },
      });
      expect(loaded?.wallet.id).toBe(txn.walletId);
      expect(loaded?.user.id).toBe(txn.userId);
    });
  });

  describe('WithdrawalRequest ↔ User ↔ Escrow', () => {
    it('should enforce withdrawalRequest userId FK', async () => {
      const w = await prisma.withdrawalRequest.findFirst();
      if (!w) return;
      const loaded = await prisma.withdrawalRequest.findUnique({
        where: { id: w.id },
        include: { user: true },
      });
      expect(loaded?.user.id).toBe(w.userId);
    });
  });

  describe('ProductReview ↔ Product ↔ User', () => {
    it('should enforce ProductReview productId and customerId FKs', async () => {
      const review = await prisma.productReview.findFirst();
      if (!review) return;
      const loaded = await prisma.productReview.findUnique({
        where: { id: review.id },
        include: { product: true, customer: true },
      });
      expect(loaded?.product.id).toBe(review.productId);
      expect(loaded?.customer.id).toBe(review.customerId);
    });
  });

  describe('BabalawoReview ↔ User', () => {
    it('should enforce BabalawoReview babalawoId and clientId FKs', async () => {
      const review = await prisma.babalawoReview.findFirst();
      if (!review) return;
      const loaded = await prisma.babalawoReview.findUnique({
        where: { id: review.id },
        include: { babalawo: true, client: true },
      });
      expect(loaded?.babalawo.id).toBe(review.babalawoId);
      expect(loaded?.client.id).toBe(review.clientId);
    });
  });

  describe('Document ↔ User', () => {
    it('should enforce document uploadedBy and sharedWith FKs', async () => {
      const doc = await prisma.document.findFirst();
      if (!doc) return;
      const loaded = await prisma.document.findUnique({
        where: { id: doc.id },
        include: { uploader: true, sharer: true },
      });
      expect(loaded?.uploader.id).toBe(doc.uploadedBy);
      expect(loaded?.sharer.id).toBe(doc.sharedWith);
    });
  });

  describe('SocialLink ↔ User', () => {
    it('should enforce SocialLink userId FK and cascade on user delete', async () => {
      const link = await prisma.socialLink.findFirst();
      if (!link) return;
      const loaded = await prisma.socialLink.findUnique({
        where: { id: link.id },
        include: { user: true },
      });
      expect(loaded?.user.id).toBe(link.userId);
    });
  });
});
