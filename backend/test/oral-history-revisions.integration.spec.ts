/**
 * FOR-024: oral history revision history, through the real HTTP stack and
 * database. Edits used to overwrite an entry in place -- a community member's
 * elder-approved story could be changed with no record of what it said.
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

describe('Oral history revisions (FOR-024)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let admin: { id: string; token: string };
  let member: { id: string; token: string };
  let entryId: string;

  async function newUser() {
    const email = `oh-rev-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SecurePassword123!', name: 'Oral History Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  const patch = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .patch(`/admin/cultural/oral-histories/${entryId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send(body)
      .expect(200);

  const revisions = () => prisma.oralHistoryRevision.findMany({ where: { entryId }, orderBy: { createdAt: 'asc' } });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    admin = await newUser();
    member = await newUser();
    // JwtStrategy reads the role from the database on every request
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN', adminSubRole: 'SUPER' } });

    const res = await request(app.getHttpServer())
      .post('/admin/cultural/oral-histories')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Ìtàn Ọ̀rúnmìlà', category: 'ODU', content: 'The original telling.', tags: ['odu'] })
      .expect(201);
    entryId = res.body.id;
  });

  afterAll(async () => {
    // entries and revisions cascade from their creator; editedBy is SET NULL
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('does not record a revision for a publish toggle alone', async () => {
    await patch({ publish: true });
    expect(await revisions()).toHaveLength(0);
  });

  it('snapshots the previous version when the story changes, and who changed it', async () => {
    await patch({ content: 'A corrected telling.', tags: ['odu', 'corrected'] });

    const revs = await revisions();
    expect(revs).toHaveLength(1);
    expect(revs[0].content).toBe('The original telling.');
    expect(revs[0].tags).toEqual(['odu']);
    expect(revs[0].title).toBe('Ìtàn Ọ̀rúnmìlà');
    expect(revs[0].editedBy).toBe(admin.id);

    const entry = await prisma.oralHistoryEntry.findUnique({ where: { id: entryId } });
    expect(entry?.content).toBe('A corrected telling.');
  });

  it('does not record a revision when a save changes nothing', async () => {
    await patch({ content: 'A corrected telling.', tags: ['odu', 'corrected'] });
    expect(await revisions()).toHaveLength(1);
  });

  it('lists revisions newest first, with the editor, for admins only', async () => {
    await patch({ title: 'Ìtàn Ọ̀rúnmìlà (revised)' });

    const res = await request(app.getHttpServer())
      .get(`/admin/cultural/oral-histories/${entryId}/revisions`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].content).toBe('A corrected telling.'); // newest snapshot first
    expect(res.body[1].content).toBe('The original telling.');
    expect(res.body[0].editor.name).toBe('Oral History Test');

    await request(app.getHttpServer())
      .get(`/admin/cultural/oral-histories/${entryId}/revisions`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);
  });
});
