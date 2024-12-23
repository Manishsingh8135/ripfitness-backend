import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let superAdminToken: string;
  let adminToken: string;
  let trainerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get MongoDB connection
    mongoConnection = moduleFixture.get<Connection>('DatabaseConnection');
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  describe('Authentication', () => {
    it('should login as super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@ripfitness.com',
          password: 'SuperAdmin@123',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.role).toBe('super_admin');
      expect(response.body.user.permissions).toContain('system:settings');

      superAdminToken = response.body.access_token;
    });

    it('should login as regular admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin2@ripfitness.com',
          password: 'Admin@123',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.permissions).not.toContain('system:settings');
      expect(response.body.user.permissions).toContain('manage:users');

      adminToken = response.body.access_token;
    });

    it('should login as trainer', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'trainer@ripfitness.com',
          password: 'Trainer@123',
        })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.role).toBe('trainer');
      expect(response.body.user.permissions).toContain('manage:workouts');
      expect(response.body.user.permissions).toContain('manage:classes');

      trainerToken = response.body.access_token;
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@email.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });
});
