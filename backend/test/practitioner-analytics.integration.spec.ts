/**
 * Practitioner analytics, through the real HTTP stack and database.
 *
 * GET /practitioners/analytics 500'd for every babalawo -- the analytics page
 * never loaded: its raw queries ran EXTRACT/>= on Appointment.date (a
 * 'YYYY-MM-DD' String), selected a `service` column that doesn't exist, and
 * returned Decimal/BigInt values the code then indexed and serialized.
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

const ymd = (d: Date) => d.toISOString().slice(0, 10);

describe('Practitioner analytics (GET /practitioners/analytics)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userIds: string[] = [];
  let babalawo: { id: string; token: string };

  async function newUser(role: UserRole) {
    const email = `analytics-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SecurePassword123!', name: 'Analytics Test', role })
      .expect(201);
    userIds.push(res.body.user.id);
    return { id: res.body.user.id as string, token: res.body.accessToken as string };
  }

  // A recent Wednesday, so the "busiest day" has a known answer.
  const recentWeekday = (weekday: number, weeksAgo: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 7 * weeksAgo - ((d.getUTCDay() - weekday + 7) % 7));
    return d;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);

    babalawo = await newUser(UserRole.BABALAWO);
    const clientA = await newUser(UserRole.CLIENT);
    const clientB = await newUser(UserRole.CLIENT);

    const base = { babalawoId: babalawo.id, status: 'COMPLETED' };
    await prisma.appointment.createMany({
      data: [
        { ...base, clientId: clientA.id, date: ymd(recentWeekday(3, 1)), time: '14:00', topic: 'Ìkọ́sẹ̀dáyé', price: 15000 },
        { ...base, clientId: clientA.id, date: ymd(recentWeekday(3, 2)), time: '14:30', topic: 'Ìkọ́sẹ̀dáyé', price: 15000 },
        { ...base, clientId: clientB.id, date: ymd(recentWeekday(1, 3)), time: '09:00', topic: 'Odù reading', price: 10000 },
        // not completed -- must not count
        { babalawoId: babalawo.id, clientId: clientB.id, date: ymd(recentWeekday(5, 1)), time: '18:00', status: 'UPCOMING', topic: 'Odù reading' },
      ],
    });
  });

  afterAll(async () => {
    // appointments cascade from their babalawo/client
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('computes every figure instead of 500ing', async () => {
    const res = await request(app.getHttpServer())
      .get('/practitioners/analytics')
      .set('Authorization', `Bearer ${babalawo.token}`)
      .expect(200);
    const a = res.body;

    expect(a.totalSessions).toBe(3);
    expect(a.totalClients).toBe(2);
    expect(a.repeatClientRate).toBe(50); // clientA came twice, clientB once
    expect(a.mostPopularService).toBe('Ìkọ́sẹ̀dáyé');
    expect(a.busiestDayOfWeek).toBe('Wednesday');
    expect(a.busiestTimeOfDay).toBe('2:00 PM');
    expect(a.serviceOfferings).toEqual([
      { service: 'Ìkọ́sẹ̀dáyé', count: 2 },
      { service: 'Odù reading', count: 1 },
    ]);

    const sessions = (a.monthlySessions as { month: string; sessions: number }[]).reduce((n, m) => n + m.sessions, 0);
    expect(sessions).toBe(3);
    for (const m of a.monthlySessions) expect(m.month).toMatch(/^\d{4}-\d{2}$/);

    const income = (a.incomeOverTime as { month: string; income: number }[]).reduce((n, m) => n + m.income, 0);
    expect(income).toBe(40000);
  });

  it('answers "Not available" rather than failing for a babalawo with no sessions', async () => {
    const fresh = await newUser(UserRole.BABALAWO);
    const res = await request(app.getHttpServer())
      .get('/practitioners/analytics')
      .set('Authorization', `Bearer ${fresh.token}`)
      .expect(200);
    expect(res.body.totalSessions).toBe(0);
    expect(res.body.busiestDayOfWeek).toBe('Not available');
    expect(res.body.monthlySessions).toEqual([]);
  });
});
