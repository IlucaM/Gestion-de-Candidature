import Candidate, { ICandidate } from '../models/Candidate';
import logger from '../utils/logger';
import {
  CreateCandidateInput,
  UpdateCandidateInput,
  ValidateCandidateInput,
  QueryParamsInput,
} from '../validators/candidateValidator';

/**
 * Service pour la gestion des candidats
 * Contient toute la logique métier
 */

export interface PaginatedCandidates {
  candidates: ICandidate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Créer un nouveau candidat
 */
export const createCandidate = async (
  data: CreateCandidateInput
): Promise<ICandidate> => {
  try {
    // Vérifier si l'email existe déjà
    const existingCandidate = await Candidate.findOne({ email: data.email });
    if (existingCandidate) {
      throw new Error('Un candidat avec cet email existe déjà');
    }

    const candidate = new Candidate(data);
    await candidate.save();

    logger.info({ candidateId: candidate._id }, 'Candidat créé avec succès');
    return candidate;
  } catch (error) {
    logger.error({ error, email: data.email }, 'Erreur lors de la création du candidat');
    throw error;
  }
};

/**
 * Récupérer tous les candidats avec pagination et filtres
 */
export const getAllCandidates = async (
  params: QueryParamsInput
): Promise<PaginatedCandidates> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    // Construire la requête de filtrage
    const query: Record<string, unknown> = { isDeleted: false };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Construire le tri
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Exécuter la requête avec pagination
    const skip = (page - 1) * limit;
    const [candidates, total] = await Promise.all([
      Candidate.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Candidate.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info(
      { page, limit, total, totalPages },
      'Récupération des candidats réussie'
    );

    return {
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logger.error({ error, params }, 'Erreur lors de la récupération des candidats');
    throw error;
  }
};

/**
 * Récupérer un candidat par son ID
 */
export const getCandidateById = async (id: string): Promise<ICandidate | null> => {
  try {
    const candidate = await Candidate.findById(id);

    if (!candidate) {
      logger.warn({ candidateId: id }, 'Candidat non trouvé');
      return null;
    }

    logger.info({ candidateId: id }, 'Candidat récupéré avec succès');
    return candidate;
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Erreur lors de la récupération du candidat');
    throw error;
  }
};

/**
 * Mettre à jour un candidat
 */
export const updateCandidate = async (
  id: string,
  data: UpdateCandidateInput
): Promise<ICandidate | null> => {
  try {
    // Vérifier si le candidat existe
    const existingCandidate = await Candidate.findById(id);
    if (!existingCandidate) {
      logger.warn({ candidateId: id }, 'Candidat non trouvé pour mise à jour');
      return null;
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (data.email && data.email !== existingCandidate.email) {
      const emailExists = await Candidate.findOne({ email: data.email });
      if (emailExists) {
        throw new Error('Un candidat avec cet email existe déjà');
      }
    }

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    logger.info({ candidateId: id }, 'Candidat mis à jour avec succès');
    return candidate;
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Erreur lors de la mise à jour du candidat');
    throw error;
  }
};

/**
 * Supprimer un candidat (soft delete)
 */
export const deleteCandidate = async (id: string): Promise<ICandidate | null> => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!candidate) {
      logger.warn({ candidateId: id }, 'Candidat non trouvé pour suppression');
      return null;
    }

    logger.info({ candidateId: id }, 'Candidat supprimé (soft delete) avec succès');
    return candidate;
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Erreur lors de la suppression du candidat');
    throw error;
  }
};

/**
 * Valider un candidat (avec délai simulé de 2 secondes)
 */
export const validateCandidate = async (
  id: string,
  data: ValidateCandidateInput
): Promise<ICandidate | null> => {
  try {
    // Simuler un délai de 2 secondes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const candidate = await Candidate.findById(id);

    if (!candidate) {
      logger.warn({ candidateId: id }, 'Candidat non trouvé pour validation');
      return null;
    }

    // Mettre à jour le statut
    candidate.status = data.status;
    if (data.notes) {
      candidate.notes = data.notes;
    }
    if (data.status === 'validated') {
      candidate.validatedAt = new Date();
    }

    await candidate.save();

    logger.info(
      { candidateId: id, status: data.status },
      'Candidat validé avec succès'
    );
    return candidate;
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Erreur lors de la validation du candidat');
    throw error;
  }
};

/**
 * Restaurer un candidat supprimé
 */
export const restoreCandidate = async (id: string): Promise<ICandidate | null> => {
  try {
    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, isDeleted: true },
      {
        $set: {
          isDeleted: false,
          deletedAt: undefined,
        },
      },
      { new: true }
    );

    if (!candidate) {
      logger.warn({ candidateId: id }, 'Candidat supprimé non trouvé pour restauration');
      return null;
    }

    logger.info({ candidateId: id }, 'Candidat restauré avec succès');
    return candidate;
  } catch (error) {
    logger.error({ error, candidateId: id }, 'Erreur lors de la restauration du candidat');
    throw error;
  }
};

/**
 * Compter les candidats par statut
 */
export const getCandidatesStats = async (): Promise<Record<string, number>> => {
  try {
    const stats = await Candidate.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<string, number> = {
      pending: 0,
      reviewing: 0,
      validated: 0,
      rejected: 0,
      archived: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    logger.info({ stats: result }, 'Statistiques des candidats récupérées');
    return result;
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération des statistiques');
    throw error;
  }
};
