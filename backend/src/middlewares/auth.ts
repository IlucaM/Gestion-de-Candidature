import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import logger from '../utils/logger';

/**
 * Middleware d'authentification JWT
 */

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];

/**
 * Middleware pour vérifier le token JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Format du token invalide. Utilisez: Bearer <token>',
      });
      return;
    }

    const token = parts[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn({ error: err.message }, 'Token JWT invalide');
        res.status(401).json({
          success: false,
          message: 'Token invalide ou expiré',
        });
        return;
      }

      req.user = decoded as Request['user'];
      next();
    });
  } catch (error) {
    logger.error({ error }, "Erreur lors de l'authentification");
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'authentification",
    });
  }
};

/**
 * Middleware pour vérifier les rôles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.id, role: req.user.role, requiredRoles: roles },
        'Accès non autorisé - rôle insuffisant'
      );
      res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
      return;
    }

    next();
  };
};

/**
 * Générer un token JWT
 */
export const generateToken = (payload: { id: string; email: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export default { authenticate, authorize, generateToken };
