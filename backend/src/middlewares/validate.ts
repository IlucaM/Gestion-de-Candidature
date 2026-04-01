import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Middleware de validation avec Zod
 */

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const result = schema.parse(data);
      
      // Remplacer les données validées dans la requête
      req[source] = result;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        logger.warn(
          { errors: formattedErrors, source, path: req.path },
          'Erreur de validation Zod'
        );

        res.status(400).json({
          success: false,
          message: 'Erreur de validation des données',
          errors: formattedErrors,
        });
        return;
      }

      next(error);
    }
  };

export default validate;
