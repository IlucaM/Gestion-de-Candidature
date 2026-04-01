import { Request, Response, NextFunction } from 'express';
import * as candidateService from '../services/candidateService';
import { ApiError } from '../middlewares/errorHandler';
import {
  CreateCandidateInput,
  UpdateCandidateInput,
  ValidateCandidateInput,
  QueryParamsInput,
} from '../validators/candidateValidator';

/**
 * Contrôleur pour la gestion des candidats
 * Gère les requêtes HTTP et les réponses
 */

/**
 * Créer un nouveau candidat
 */
export const createCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body as CreateCandidateInput;
    const candidate = await candidateService.createCandidate(data);

    res.status(201).json({
      success: true,
      message: 'Candidat créé avec succès',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer tous les candidats (avec pagination)
 */
export const getAllCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params = req.query as unknown as QueryParamsInput;
    const result = await candidateService.getAllCandidates(params);

    res.status(200).json({
      success: true,
      message: 'Candidats récupérés avec succès',
      data: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un candidat par son ID
 */
export const getCandidateById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const candidate = await candidateService.getCandidateById(id);

    if (!candidate) {
      throw new ApiError('Candidat non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Candidat récupéré avec succès',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour un candidat
 */
export const updateCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body as UpdateCandidateInput;
    const candidate = await candidateService.updateCandidate(id, data);

    if (!candidate) {
      throw new ApiError('Candidat non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Candidat mis à jour avec succès',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un candidat (soft delete)
 */
export const deleteCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const candidate = await candidateService.deleteCandidate(id);

    if (!candidate) {
      throw new ApiError('Candidat non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Candidat supprimé avec succès',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Valider un candidat
 */
export const validateCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body as ValidateCandidateInput;
    const candidate = await candidateService.validateCandidate(id, data);

    if (!candidate) {
      throw new ApiError('Candidat non trouvé', 404);
    }

    res.status(200).json({
      success: true,
      message: `Candidat ${data.status === 'validated' ? 'validé' : 'rejeté'} avec succès`,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les statistiques des candidats
 */
export const getCandidatesStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await candidateService.getCandidatesStats();

    res.status(200).json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  validateCandidate,
  getCandidatesStats,
};
