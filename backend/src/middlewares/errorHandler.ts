import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion globale des erreurs
 */
export const errorHandler = (
  err: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Erreur Zod (validation)
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((error) => ({
      path: error.path.join('.'),
      message: error.message,
    }));

    logger.warn(
      { errors: formattedErrors, path: req.path },
      'Erreur de validation Zod'
    );

    res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: formattedErrors,
    });
    return;
  }

  // Erreur API personnalisée
  if (err instanceof ApiError) {
    logger.warn(
      { message: err.message, statusCode: err.statusCode, path: req.path },
      'Erreur API'
    );

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erreur MongoDB (duplicata)
  if (err.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    logger.warn({ error: err, path: req.path }, 'Erreur de duplicat MongoDB');

    res.status(409).json({
      success: false,
      message: 'Une ressource avec ces données existe déjà',
    });
    return;
  }

  // Erreur de cast MongoDB (ID invalide)
  if (err.name === 'CastError') {
    logger.warn({ error: err, path: req.path }, 'ID MongoDB invalide');

    res.status(400).json({
      success: false,
      message: 'Identifiant invalide',
    });
    return;
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    logger.warn({ error: err, path: req.path }, 'Erreur de validation Mongoose');

    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: (err as { errors?: Record<string, { message: string }> }).errors,
    });
    return;
  }

  // Erreur inconnue
  logger.error(
    { error: err, stack: err.stack, path: req.path },
    'Erreur serveur non gérée'
  );

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Erreur serveur interne'
        : err.message,
  });
};

/**
 * Middleware pour gérer les routes non trouvées
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.warn({ path: req.path, method: req.method }, 'Route non trouvée');

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} non trouvée`,
  });
};

export default { errorHandler, notFoundHandler, ApiError };
