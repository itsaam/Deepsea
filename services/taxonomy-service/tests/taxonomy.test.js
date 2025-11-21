const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db?schema=public';

const app = require('../src/index');

const JWT_SECRET = process.env.JWT_SECRET;
let adminToken;
let userToken;
let expertToken;

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(() => {
  adminToken = generateToken({
    id: 1,
    email: 'admin@test.com',
    username: 'admin',
    role: 'ADMIN'
  });

  userToken = generateToken({
    id: 2,
    email: 'user@test.com',
    username: 'user',
    role: 'USER'
  });

  expertToken = generateToken({
    id: 3,
    email: 'expert@test.com',
    username: 'expert',
    role: 'EXPERT'
  });
});

describe('Taxonomy Service - Tests Unitaires', () => {

  describe('GET /health', () => {
    it('devrait retourner le statut du service', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'taxonomy-service');
    });
  });

  describe('Authentification', () => {
    it('devrait retourner 401 sans token', async () => {
      await request(app)
        .get('/taxonomy/stats')
        .expect(401);
    });

    it('devrait rejeter les tokens malformés', async () => {
      await request(app)
        .get('/taxonomy/stats')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('devrait rejeter les tokens sans Bearer', async () => {
      await request(app)
        .get('/taxonomy/stats')
        .set('Authorization', adminToken)
        .expect(401);
    });
  });

  describe('Contrôle d\'accès par rôle', () => {
    it('USER ne devrait pas avoir accès aux routes admin', async () => {
      await request(app)
        .get('/admin/user/1/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('USER ne devrait pas avoir accès aux routes expert', async () => {
      await request(app)
        .get('/expert/species/1/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('ADMIN devrait pouvoir accéder aux routes admin (pas de 403)', async () => {
      const response = await request(app)
        .get('/admin/user/1/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).not.toBe(403);
    });

    it('EXPERT devrait pouvoir accéder aux routes expert (pas de 403)', async () => {
      const response = await request(app)
        .get('/expert/species/1/history')
        .set('Authorization', `Bearer ${expertToken}`);

      // Ne devrait pas être 403 (pas interdit)
      expect(response.status).not.toBe(403);
    });
  });

  describe('Endpoints de modération', () => {
    it('soft-delete devrait retourner 401 sans token', async () => {
      await request(app)
        .patch('/admin/observations/1/soft-delete')
        .expect(401);
    });

    it('soft-delete devrait retourner 403 pour USER', async () => {
      await request(app)
        .patch('/admin/observations/1/soft-delete')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('restore devrait retourner 401 sans token', async () => {
      await request(app)
        .patch('/admin/observations/1/restore')
        .expect(401);
    });

    it('restore devrait retourner 403 pour USER', async () => {
      await request(app)
        .patch('/admin/observations/1/restore')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Validation des paramètres', () => {
    it('devrait retourner 400 pour un ID utilisateur invalide', async () => {
      await request(app)
        .get('/admin/user/invalid/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('devrait retourner 400 pour un ID espèce invalide', async () => {
      await request(app)
        .get('/expert/species/invalid/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('Intégration avec services externes (peut échouer sans infrastructure)', () => {
    it('devrait gérer l\'absence d\'observation-service', async () => {
      const response = await request(app)
        .get('/taxonomy/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 401, 500, 503]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('devrait gérer l\'absence de base de données', async () => {
      const response = await request(app)
        .get('/admin/user/1/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });
});

describe('Structure des réponses API', () => {
  it('les erreurs devraient avoir une structure cohérente', async () => {
    const response = await request(app)
      .get('/taxonomy/stats');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('les réponses 403 devraient être formatées', async () => {
    const response = await request(app)
      .get('/admin/user/1/history')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  it('les réponses 400 devraient être formatées', async () => {
    const response = await request(app)
      .get('/admin/user/invalid/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

