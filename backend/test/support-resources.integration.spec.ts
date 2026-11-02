/**
 * FOR-015/FOR-017 support directory through the real HTTP stack: anyone can
 * read it without signing in; only admins can change it.
 *
 * Run: npm run test:integration
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@ile-ase/common';

describe('Support directory', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  const createdIds: string[] = [];
  let admin: string;
  let member: string;

  const http = () => request(app.getHttpServer());

  async function token(role: UserRole, makeAdmin = false) {
    const email = `support-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await http().post('/auth/register').send({ email, password: 'SecurePassword123!', name: 'Support Test', role }).expect(201);
    userIds.push(res.body.user.id);
    if (!makeAdmin) return res.body.accessToken as string;
    await prisma.user.update({ where: { id: res.body.user.id }, data: { role: 'ADMIN' } });
    return (await http().post('/auth/login').send({ email, password: 'SecurePassword123!' }).expect(200)).body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    admin = await token(UserRole.CLIENT, true);
    member = await token(UserRole.CLIENT);
  });

  afterAll(async () => {
    await prisma.supportResource.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('lets an admin add an entry that anyone can then read without signing in', async () => {
    const entry = { name: 'Test Grief Line', country: 'Nigeria', helpsWith: 'Grief support', url: 'https://example.org/grief' };
    await http().post('/support-resources').set('Authorization', `Bearer ${member}`).send(entry).expect(403);
    const created = await http().post('/support-resources').set('Authorization', `Bearer ${admin}`).send(entry).expect(201);
    createdIds.push(created.body.id);

    const list = await http().get('/support-resources').expect(200);
    expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.id, name: 'Test Grief Line' })]));

    await http().patch(`/support-resources/${created.body.id}`).set('Authorization', `Bearer ${admin}`).send({ isActive: false }).expect(200);
    const after = await http().get('/support-resources').expect(200);
    expect(after.body.find((r: { id: string }) => r.id === created.body.id)).toBeUndefined();
  });

  it('rejects an entry with no way to reach them, or a non-web link', async () => {
    await http().post('/support-resources').set('Authorization', `Bearer ${admin}`).send({ name: 'Nowhere', country: 'Nigeria', helpsWith: 'x' }).expect(400);
    await http()
      .post('/support-resources')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Bad link', country: 'Nigeria', helpsWith: 'Grief', url: 'javascript:alert(1)' })
      .expect(400);
  });
});
