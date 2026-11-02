/**
 * FOR-024 (owner decision November 2, 2026): a member keeps the rights to a
 * story they submit and grants a non-exclusive, non-commercial licence they
 * can withdraw. Submitting without agreeing is refused; withdrawing takes the
 * story off the platform, published or not.
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

describe('Oral history licence', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let author: string;
  let other: string;

  const http = () => request(app.getHttpServer());
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });
  const story = { title: 'Ìtàn Ọ̀ṣun', category: 'creation-stories', content: 'As my grandmother told it ...' };

  async function token() {
    const res = await http()
      .post('/auth/register')
      .send({ email: `licence-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Licence Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return res.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    author = await token();
    other = await token();
  });

  afterAll(async () => {
    await prisma.oralHistoryEntry.deleteMany({ where: { createdBy: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('refuses a submission without agreeing to the licence, and records the version agreed to', async () => {
    await http().post('/cultural/oral-histories/submit').set(as(author)).send(story).expect(400);
    await http().post('/cultural/oral-histories/submit').set(as(author)).send({ ...story, acceptLicence: false }).expect(400);

    const licence = await http().get('/cultural/oral-histories/licence').expect(200);
    const created = await http().post('/cultural/oral-histories/submit').set(as(author)).send({ ...story, acceptLicence: true }).expect(201);
    expect(created.body).toMatchObject({ licenceVersion: licence.body.version, publishedAt: null });
    expect(created.body.licenceAcceptedAt).toBeTruthy();
  });

  it('lets only the author withdraw a story, which takes it off the platform even once published', async () => {
    const created = await http().post('/cultural/oral-histories/submit').set(as(author)).send({ ...story, acceptLicence: true }).expect(201);
    await prisma.oralHistoryEntry.update({ where: { id: created.body.id }, data: { publishedAt: new Date() } });
    const published = await http().get('/cultural/oral-histories').expect(200);
    expect(JSON.stringify(published.body)).toContain(created.body.id);

    await http().post(`/cultural/oral-histories/${created.body.id}/withdraw`).set(as(other)).expect(404);
    await http().post(`/cultural/oral-histories/${created.body.id}/withdraw`).set(as(author)).expect(201);

    const after = await http().get('/cultural/oral-histories').expect(200);
    expect(JSON.stringify(after.body)).not.toContain(created.body.id);
    const mine = await http().get('/cultural/oral-histories/mine').set(as(author)).expect(200);
    expect(mine.body.map((s: { id: string }) => s.id)).not.toContain(created.body.id);
  });
});
