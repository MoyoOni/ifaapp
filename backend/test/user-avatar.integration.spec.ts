/**
 * Profile photos, through the real HTTP stack and database.
 *
 * Onboarding's "Add Your Photo" PATCHed the image data into User.avatar, which
 * only accepts a URL: every photo was rejected with a 400 and onboarding
 * carried on as if it had been saved. There was also nowhere to keep one --
 * the server-side "store" returned a placeholder URL without saving anything.
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

// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const dataUrl = (mime: string, data: Buffer) => `data:${mime};base64,${data.toString('base64')}`;

describe('Profile photos', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];

  const http = () => request(app.getHttpServer());

  async function newUser() {
    const res = await http()
      .post('/auth/register')
      .send({ email: `avatar-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`, password: 'SecurePassword123!', name: 'Avatar Test', role: UserRole.CLIENT })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('saves a photo, points the profile at it, and serves it to anyone', async () => {
    const me = await newUser();
    const set = await http().put(`/users/${me.id}/avatar`).set('Authorization', `Bearer ${me.token}`)
      .send({ image: dataUrl('image/png', PNG) }).expect(200);
    expect(set.body.avatar).toMatch(new RegExp(`^/api/users/${me.id}/avatar\\?v=\\d+$`));

    const user = await prisma.user.findUnique({ where: { id: me.id } });
    expect(user?.avatar).toBe(set.body.avatar);

    const got = await http().get(`/users/${me.id}/avatar`).expect(200);
    expect(got.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(got.body, PNG)).toBe(0);
  });

  it("lets the profile form send the saved photo's URL back unchanged", async () => {
    const me = await newUser();
    const { body } = await http().put(`/users/${me.id}/avatar`).set('Authorization', `Bearer ${me.token}`)
      .send({ image: dataUrl('image/png', PNG) }).expect(200);
    await http().patch(`/users/${me.id}`).set('Authorization', `Bearer ${me.token}`)
      .send({ avatar: body.avatar, bio: 'Ọmọ Ifá' }).expect(200);
  });

  it("refuses someone else's photo, and anonymous uploads", async () => {
    const me = await newUser();
    const other = await newUser();
    await http().put(`/users/${me.id}/avatar`).set('Authorization', `Bearer ${other.token}`)
      .send({ image: dataUrl('image/png', PNG) }).expect(403);
    await http().put(`/users/${me.id}/avatar`).send({ image: dataUrl('image/png', PNG) }).expect(401);
    expect(await prisma.userAvatar.findUnique({ where: { userId: me.id } })).toBeNull();
  });

  it('refuses anything that is not a small JPEG, PNG or WebP', async () => {
    const me = await newUser();
    const put = (image: string) => http().put(`/users/${me.id}/avatar`).set('Authorization', `Bearer ${me.token}`).send({ image });
    await put(dataUrl('image/svg+xml', Buffer.from('<svg onload="alert(1)"/>'))).expect(400);
    await put(dataUrl('image/jpeg', PNG)).expect(400); // says JPEG, is PNG
    await put(dataUrl('image/png', Buffer.from('not an image'))).expect(400);
    await put(dataUrl('image/png', Buffer.concat([PNG, Buffer.alloc(66 * 1024)]))).expect(400);
  });

  it('404s for a member with no photo', async () => {
    const me = await newUser();
    await http().get(`/users/${me.id}/avatar`).expect(404);
  });
});
