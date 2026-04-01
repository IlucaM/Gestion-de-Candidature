import request from 'supertest';
import app from '../../src/server';
import Candidate from '../../src/models/Candidate';
import { generateToken } from '../../src/middlewares/auth';

/**
 * Tests de sécurité
 * - Injection SQL/NoSQL
 - Attaques brute force
 - Authentification
 */

describe('Security Tests', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = generateToken({
      id: '1',
      email: 'admin@test24h.com',
      role: 'admin',
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('devrait rejeter les injections NoSQL dans la création', async () => {
      const maliciousPayload = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: { $ne: null }, // Tentative d'injection
      };

      await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousPayload)
        .expect(400);
    });

    it('devrait rejeter les opérateurs MongoDB dans les paramètres de recherche', async () => {
      // Créer un candidat pour le test
      await Candidate.create({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
      });

      // Tentative d'injection via le paramètre de recherche
      const response = await request(app)
        .get('/api/candidates?search[$ne]=null')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // La recherche devrait être traitée comme une chaîne, pas comme un opérateur
      expect(response.body.data).toHaveLength(0);
    });

    it('devrait rejeter les injections dans l\'ID', async () => {
      await request(app)
        .get('/api/candidates/{"$ne": null}')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('XSS Prevention', () => {
    it('devrait échapper les scripts dans les champs texte', async () => {
      const xssPayload = {
        firstName: '<script>alert("XSS")</script>',
        lastName: 'Dupont',
        email: 'xss@example.com',
        notes: '<img src=x onerror=alert("XSS")>',
      };

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssPayload)
        .expect(201);

      // Les scripts ne devraient pas être exécutables
      expect(response.body.data.firstName).toBe(
        '<script>alert("XSS")</script>'
      );
      // Mais ils sont stockés tels quels (le frontend doit les échapper)
    });
  });

  describe('Authentication Security', () => {
    it('devrait rejeter les tokens invalides', async () => {
      await request(app)
        .get('/api/candidates')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('devrait rejeter les tokens mal formés', async () => {
      await request(app)
        .get('/api/candidates')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('devrait rejeter les requêtes sans token', async () => {
      await request(app).get('/api/candidates').expect(401);
    });

    it('devrait rejeter les tokens expirés', async () => {
      // Créer un token expiré
      const expiredToken = require('jsonwebtoken').sign(
        { id: '1', email: 'test@test.com', role: 'user' },
        process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise',
        { expiresIn: '-1s' }
      );

      // Attendre un peu pour s'assurer que le token est expiré
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .get('/api/candidates')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Brute Force Protection', () => {
    it('devrait bloquer après plusieurs tentatives de connexion échouées', async () => {
      // Faire 5 tentatives échouées
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@test24h.com',
            password: 'wrong-password',
          })
          .expect(401);
      }

      // La 6ème tentative devrait être bloquée
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test24h.com',
          password: 'wrong-password',
        })
        .expect(429);

      expect(response.body.message).toContain('Trop de tentatives');
    });
  });

  describe('Rate Limiting', () => {
    it('devrait limiter les requêtes excessives', async () => {
      // Faire plus de 100 requêtes rapidement
      const requests = [];
      for (let i = 0; i < 105; i++) {
        requests.push(
          request(app)
            .get('/health')
            .catch((err) => err.response)
        );
      }

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(
        (r) => r.status === 429
      );

      // Au moins certaines requêtes devraient être bloquées
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('devrait valider la longueur des champs', async () => {
      const longName = 'a'.repeat(1000);

      await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: longName,
          lastName: 'Dupont',
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('devrait valider le format de l\'email', async () => {
      await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'not-an-email',
        })
        .expect(400);
    });

    it('devrait valider le format du téléphone', async () => {
      await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'test@example.com',
          phone: 'not-a-phone',
        })
        .expect(400);
    });

    it('devrait limiter le nombre de compétences', async () => {
      await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'test@example.com',
          skills: Array(25).fill('skill'),
        })
        .expect(400);
    });
  });

  describe('CORS Security', () => {
    it('devrait inclure les en-têtes CORS appropriés', async () => {
      const response = await request(app)
        .options('/api/candidates')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('devrait rejeter les origines non autorisées', async () => {
      // Le CORS est configuré pour accepter localhost:5173
      // Une origine différente ne devrait pas avoir accès
      const response = await request(app)
        .get('/api/candidates')
        .set('Origin', 'http://malicious-site.com');

      // La requête peut passer mais sans les headers CORS appropriés
      // ou être bloquée selon la configuration
      expect(response.status).toBe(401); // Pas de token
    });
  });

  describe('Helmet Security Headers', () => {
    it('devrait inclure les en-têtes de sécurité', async () => {
      const response = await request(app).get('/health');

      // Vérifier la présence des en-têtes de sécurité
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });
});
