import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';

describe('UsersController (e2e)', () => {
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

    // Login and get tokens
    const superAdminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@ripfitness.com',
        password: 'SuperAdmin@123',
      });
    superAdminToken = superAdminResponse.body.access_token;

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin2@ripfitness.com',
        password: 'Admin@123',
      });
    adminToken = adminResponse.body.access_token;

    const trainerResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'trainer@ripfitness.com',
        password: 'Trainer@123',
      });
    trainerToken = trainerResponse.body.access_token;
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  describe('GET /users', () => {
    it('should allow super admin to get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should allow admin to get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('should not allow trainer to get all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(403);
    });
  });

  describe('POST /users/trainers', () => {
    it('should allow super admin to create trainer', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/trainers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'newtrainer@ripfitness.com',
          password: 'Trainer@123',
          firstName: 'New',
          lastName: 'Trainer',
        })
        .expect(201);

      expect(response.body.role).toBe('trainer');
      expect(response.body.permissions).toContain('manage:workouts');
      expect(response.body.permissions).toContain('manage:classes');
    });

    it('should allow admin to create trainer', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/trainers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newtrainer2@ripfitness.com',
          password: 'Trainer@123',
          firstName: 'New',
          lastName: 'Trainer2',
        })
        .expect(201);

      expect(response.body.role).toBe('trainer');
    });

    it('should not allow trainer to create trainer', () => {
      return request(app.getHttpServer())
        .post('/users/trainers')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({
          email: 'newtrainer3@ripfitness.com',
          password: 'Trainer@123',
          firstName: 'New',
          lastName: 'Trainer3',
        })
        .expect(403);
    });
  });

  describe('POST /users/admins', () => {
    it('should allow super admin to create admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/admins')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'newadmin@ripfitness.com',
          password: 'Admin@123',
          firstName: 'New',
          lastName: 'Admin',
        })
        .expect(201);

      expect(response.body.role).toBe('admin');
      expect(response.body.permissions).toContain('manage:users');
      expect(response.body.permissions).not.toContain('system:settings');
    });

    it('should not allow regular admin to create admin', () => {
      return request(app.getHttpServer())
        .post('/users/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newadmin2@ripfitness.com',
          password: 'Admin@123',
          firstName: 'New',
          lastName: 'Admin2',
        })
        .expect(403);
    });
  });
});
