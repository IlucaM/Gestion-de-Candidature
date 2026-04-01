import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * Routes d'authentification
 */

// Connexion avec rate limiting strict (prévention brute force)
router.post('/login', authLimiter, authController.login);

// Récupérer le profil (nécessite authentification)
router.get('/profile', authenticate, authController.getProfile);

// Rafraîchir le token (nécessite authentification)
router.post('/refresh', authenticate, authController.refreshToken);

export default router;
