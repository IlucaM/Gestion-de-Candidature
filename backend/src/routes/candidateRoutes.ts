import { Router } from 'express';
import * as candidateController from '../controllers/candidateController';
import { authenticate } from '../middlewares/auth';
import validate from '../middlewares/validate';
import {
  createCandidateSchema,
  updateCandidateSchema,
  validateCandidateSchema,
  queryParamsSchema,
} from '../validators/candidateValidator';
import {
  generalLimiter,
  createCandidateLimiter,
  validationLimiter,
} from '../middlewares/rateLimiter';

const router = Router();

/**
 * Routes pour la gestion des candidats
 * Toutes les routes nécessitent une authentification
 */

// Appliquer l'authentification à toutes les routes
router.use(authenticate);
router.use(generalLimiter);

// Routes pour les statistiques
router.get('/stats', candidateController.getCandidatesStats);

// Routes CRUD de base
router.post(
  '/',
  createCandidateLimiter,
  validate(createCandidateSchema),
  candidateController.createCandidate
);

router.get(
  '/',
  validate(queryParamsSchema),
  candidateController.getAllCandidates
);

router.get('/:id', candidateController.getCandidateById);

router.put(
  '/:id',
  validate(updateCandidateSchema),
  candidateController.updateCandidate
);

router.delete('/:id', candidateController.deleteCandidate);

// Route de validation
router.post(
  '/:id/validate',
  validationLimiter,
  validate(validateCandidateSchema),
  candidateController.validateCandidate
);

export default router;
