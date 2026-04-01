import request from 'supertest';
import app from '../../src/server';
import Candidate from '../../src/models/Candidate';
import { generateToken } from '../../src/middlewares/auth';

/**
 * Tests d'intégration pour les routes des candidats
 * Teste les endpoints API avec une base de données en mémoire
 */

describe('Candidate Routes Integration', () => {
  let authToken: string;

  const mockCandidate = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33123456789',
    skills: ['JavaScript', 'TypeScript'],
    experience: 5,
    education: 'master',
  };

  beforeAll(() => {
    // Générer un token JWT pour les tests
    authToken = generateToken({
      id: '1',
      email: 'admin@test24h.com',
      role: 'admin',
    });
  });

  describe('POST /api/candidates', () => {
    it('devrait créer un candidat avec succès', async () => {
      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockCandidate)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockCandidate.email);
      expect(response.body.data.status).toBe('pending');
    });

    it('devrait rejeter sans authentification', async () => {
      await request(app).post('/api/candidates').send(mockCandidate).expect(401);
    });

    it('devrait valider les données', async () => {
      const invalidCandidate = {
        firstName: '',
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCandidate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('devrait rejeter un email en double', async () => {
      await Candidate.create(mockCandidate);

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockCandidate)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/candidates', () => {
    beforeEach(async () => {
      await Candidate.create([
        mockCandidate,
        {
          ...mockCandidate,
          email: 'marie@example.com',
          firstName: 'Marie',
          status: 'validated',
        },
      ]);
    });

    it('devrait récupérer tous les candidats', async () => {
      const response = await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('devrait filtrer par statut', async () => {
      const response = await request(app)
        .get('/api/candidates?status=validated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Marie');
    });

    it('devrait rechercher par nom', async () => {
      const response = await request(app)
        .get('/api/candidates?search=Jean')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Jean');
    });

    it('devrait gérer la pagination', async () => {
      const response = await request(app)
        .get('/api/candidates?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('devrait récupérer un candidat par ID', async () => {
      const candidate = await Candidate.create(mockCandidate);

      const response = await request(app)
        .get(`/api/candidates/${candidate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockCandidate.email);
    });

    it('devrait retourner 404 pour un ID inexistant', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/candidates/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('devrait retourner 400 pour un ID invalide', async () => {
      const response = await request(app)
        .get('/api/candidates/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/candidates/:id', () => {
    it('devrait mettre à jour un candidat', async () => {
      const candidate = await Candidate.create(mockCandidate);

      const updates = {
        firstName: 'Jeanne',
        experience: 6,
      };

      const response = await request(app)
        .put(`/api/candidates/${candidate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Jeanne');
      expect(response.body.data.experience).toBe(6);
    });

    it('devrait valider les données de mise à jour', async () => {
      const candidate = await Candidate.create(mockCandidate);

      const response = await request(app)
        .put(`/api/candidates/${candidate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('devrait supprimer un candidat (soft delete)', async () => {
      const candidate = await Candidate.create(mockCandidate);

      const response = await request(app)
        .delete(`/api/candidates/${candidate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Vérifier que le candidat n'est plus accessible
      await request(app)
        .get(`/api/candidates/${candidate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/candidates/:id/validate', () => {
    it('devrait valider un candidat après 2 secondes', async () => {
      const candidate = await Candidate.create(mockCandidate);
      const startTime = Date.now();

      const response = await request(app)
        .post(`/api/candidates/${candidate._id}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'validated' })
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('validated');
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
    });

    it('devrait rejeter un candidat', async () => {
      const candidate = await Candidate.create(mockCandidate);

      const response = await request(app)
        .post(`/api/candidates/${candidate._id}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'rejected', notes: 'Profil non adapté' })
        .expect(200);

      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.notes).toBe('Profil non adapté');
    });

    it('devrait valider le statut', async () => {
      const candidate = await Candidate.create(mockCandidate);

      const response = await request(app)
        .post(`/api/candidates/${candidate._id}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/candidates/stats', () => {
    it('devrait retourner les statistiques', async () => {
      await Candidate.create([
        mockCandidate,
        { ...mockCandidate, email: '1@example.com', status: 'validated' },
        { ...mockCandidate, email: '2@example.com', status: 'rejected' },
      ]);

      const response = await request(app)
        .get('/api/candidates/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.pending).toBe(1);
      expect(response.body.data.validated).toBe(1);
      expect(response.body.data.rejected).toBe(1);
    });
  });
});
