import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

/**
 * Configuration du rate limiting pour protéger l'API
 */

// Rate limiter général pour toutes les routes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit dépassé - général');
    res.status(options.statusCode).json(options.message);
  },
});

// Rate limiter strict pour l'authentification (prévention brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par fenêtre
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
  handler: (req, res, _next, options) => {
    logger.warn(
      { ip: req.ip, email: req.body?.email },
      'Rate limit dépassé - authentification (possible attaque brute force)'
    );
    res.status(options.statusCode).json(options.message);
  },
});

// Rate limiter pour la création de candidats
export const createCandidateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 créations par minute
  message: {
    success: false,
    message: 'Trop de candidats créés, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn({ ip: req.ip }, 'Rate limit dépassé - création de candidats');
    res.status(options.statusCode).json(options.message);
  },
});

// Rate limiter pour les opérations de validation
export const validationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 validations par minute
  message: {
    success: false,
    message: 'Trop de validations, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn({ ip: req.ip, candidateId: req.params.id }, 'Rate limit dépassé - validation');
    res.status(options.statusCode).json(options.message);
  },
});

export default {
  generalLimiter,
  authLimiter,
  createCandidateLimiter,
  validationLimiter,
};
