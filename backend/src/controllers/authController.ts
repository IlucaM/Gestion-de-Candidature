import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middlewares/auth';
import { ApiError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

/**
 * Contrôleur d'authentification
 * Gère la connexion et l'inscription des utilisateurs
 */

// Utilisateurs en mémoire pour le test (en production, utiliser une base de données)
interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
}

const users: User[] = [
  {
    id: '1',
    email: 'admin@test24h.com',
    // Mot de passe: Admin123!
    password: '$2a$10$pPm2WHd9LFhN7eeltGg55eQ5A6aSkQhVGjdGHILFU4J5uwvs1EDB6',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Test24h',
  },
  {
    id: '2',
    email: 'recruteur@test24h.com',
    // Mot de passe: Recruteur123!
    password: '$2a$10$RJkkUim9iU8.NvNx34JMROStIy5EuGUSyQ826eZenMBfakpab9kjq',
    role: 'recruiter',
    firstName: 'Jean',
    lastName: 'Recruteur',
  },
];

/**
 * Connexion d'un utilisateur
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError('Email et mot de passe requis', 400);
    }

    // Rechercher l'utilisateur
    const user = users.find((u) => u.email === email);
    if (!user) {
      logger.warn({ email }, 'Tentative de connexion avec email inconnu');
      throw new ApiError('Email ou mot de passe incorrect', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn({ email }, 'Tentative de connexion avec mot de passe incorrect');
      throw new ApiError('Email ou mot de passe incorrect', 401);
    }

    // Générer le token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email }, 'Utilisateur connecté avec succès');

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError('Non authentifié', 401);
    }

    const user = users.find((u) => u.id === req.user!.id);
    if (!user) {
      throw new ApiError('Utilisateur non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rafraîchir le token JWT
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError('Non authentifié', 401);
    }

    const user = users.find((u) => u.id === req.user!.id);
    if (!user) {
      throw new ApiError('Utilisateur non trouvé', 404);
    }

    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: { token: newToken },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  getProfile,
  refreshToken,
};
