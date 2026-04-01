import Candidate from '../../src/models/Candidate';
import * as candidateService from '../../src/services/candidateService';

/**
 * Tests unitaires pour le service des candidats
 * Couverture visée : 100%
 */

describe('CandidateService', () => {
  const mockCandidate = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33123456789',
    address: '123 Rue de Paris',
    city: 'Paris',
    country: 'France',
    postalCode: '75001',
    skills: ['JavaScript', 'TypeScript', 'Node.js'],
    experience: 5,
    education: 'master' as const,
    notes: 'Candidat prometteur',
  };

  describe('createCandidate', () => {
    it('devrait créer un candidat avec succès', async () => {
      const result = await candidateService.createCandidate(mockCandidate);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(mockCandidate.firstName);
      expect(result.lastName).toBe(mockCandidate.lastName);
      expect(result.email).toBe(mockCandidate.email);
      expect(result.status).toBe('pending');
    });

    it('devrait rejeter si l\'email existe déjà', async () => {
      // Créer le premier candidat
      await candidateService.createCandidate(mockCandidate);

      // Tenter de créer un deuxième avec le même email
      await expect(
        candidateService.createCandidate(mockCandidate)
      ).rejects.toThrow('Un candidat avec cet email existe déjà');
    });

    it('devrait créer un candidat avec les valeurs par défaut', async () => {
      const minimalCandidate = {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
      };

      const result = await candidateService.createCandidate(minimalCandidate);

      expect(result.skills).toEqual([]);
      expect(result.experience).toBe(0);
      expect(result.education).toBe('other');
      expect(result.status).toBe('pending');
    });
  });

  describe('getAllCandidates', () => {
    beforeEach(async () => {
      // Créer plusieurs candidats pour les tests
      await Candidate.create([
        mockCandidate,
        {
          ...mockCandidate,
          email: 'marie.martin@example.com',
          firstName: 'Marie',
          lastName: 'Martin',
          status: 'validated',
        },
        {
          ...mockCandidate,
          email: 'pierre.durand@example.com',
          firstName: 'Pierre',
          lastName: 'Durand',
          status: 'rejected',
        },
      ]);
    });

    it('devrait récupérer tous les candidats avec pagination', async () => {
      const result = await candidateService.getAllCandidates({
        page: 1,
        limit: 10,
      });

      expect(result.candidates).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('devrait filtrer par statut', async () => {
      const result = await candidateService.getAllCandidates({
        page: 1,
        limit: 10,
        status: 'validated',
      });

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].firstName).toBe('Marie');
    });

    it('devrait rechercher par nom', async () => {
      const result = await candidateService.getAllCandidates({
        page: 1,
        limit: 10,
        search: 'Jean',
      });

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].firstName).toBe('Jean');
    });

    it('devrait rechercher par email', async () => {
      const result = await candidateService.getAllCandidates({
        page: 1,
        limit: 10,
        search: 'marie.martin',
      });

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].email).toBe('marie.martin@example.com');
    });

    it('devrait trier les résultats', async () => {
      const result = await candidateService.getAllCandidates({
        page: 1,
        limit: 10,
        sortBy: 'lastName',
        sortOrder: 'asc',
      });

      expect(result.candidates[0].lastName).toBe('Dupont');
      expect(result.candidates[1].lastName).toBe('Durand');
      expect(result.candidates[2].lastName).toBe('Martin');
    });

    it('devrait gérer la pagination correctement', async () => {
      const result = await candidateService.getAllCandidates({
        page: 1,
        limit: 2,
      });

      expect(result.candidates).toHaveLength(2);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);
    });
  });

  describe('getCandidateById', () => {
    it('devrait récupérer un candidat par son ID', async () => {
      const created = await candidateService.createCandidate(mockCandidate);
      const result = await candidateService.getCandidateById(created._id.toString());

      expect(result).toBeDefined();
      expect(result?.email).toBe(mockCandidate.email);
    });

    it('devrait retourner null si le candidat n\'existe pas', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const result = await candidateService.getCandidateById(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('updateCandidate', () => {
    it('devrait mettre à jour un candidat', async () => {
      const created = await candidateService.createCandidate(mockCandidate);
      const updates = {
        firstName: 'Jeanne',
        experience: 6,
      };

      const result = await candidateService.updateCandidate(
        created._id.toString(),
        updates
      );

      expect(result).toBeDefined();
      expect(result?.firstName).toBe('Jeanne');
      expect(result?.experience).toBe(6);
      expect(result?.lastName).toBe(mockCandidate.lastName); // Non modifié
    });

    it('devrait retourner null si le candidat n\'existe pas', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const result = await candidateService.updateCandidate(fakeId, {
        firstName: 'Test',
      });

      expect(result).toBeNull();
    });

    it('devrait rejeter si le nouvel email existe déjà', async () => {
      await candidateService.createCandidate(mockCandidate);
      const secondCandidate = await candidateService.createCandidate({
        ...mockCandidate,
        email: 'autre@example.com',
      });

      await expect(
        candidateService.updateCandidate(secondCandidate._id.toString(), {
          email: mockCandidate.email,
        })
      ).rejects.toThrow('Un candidat avec cet email existe déjà');
    });
  });

  describe('deleteCandidate', () => {
    it('devrait effectuer un soft delete', async () => {
      const created = await candidateService.createCandidate(mockCandidate);
      const result = await candidateService.deleteCandidate(created._id.toString());

      expect(result).toBeDefined();
      expect(result?.isDeleted).toBe(true);
      expect(result?.deletedAt).toBeDefined();

      // Vérifier que le candidat n'est plus récupérable
      const notFound = await candidateService.getCandidateById(created._id.toString());
      expect(notFound).toBeNull();
    });

    it('devrait retourner null si le candidat n\'existe pas', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const result = await candidateService.deleteCandidate(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('validateCandidate', () => {
    it('devrait valider un candidat après un délai de 2 secondes', async () => {
      const created = await candidateService.createCandidate(mockCandidate);
      const startTime = Date.now();

      const result = await candidateService.validateCandidate(
        created._id.toString(),
        { status: 'validated' }
      );

      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result?.status).toBe('validated');
      expect(result?.validatedAt).toBeDefined();
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
    });

    it('devrait rejeter un candidat', async () => {
      const created = await candidateService.createCandidate(mockCandidate);

      const result = await candidateService.validateCandidate(
        created._id.toString(),
        { status: 'rejected', notes: 'Profil non adapté' }
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('rejected');
      expect(result?.notes).toBe('Profil non adapté');
      expect(result?.validatedAt).toBeUndefined();
    });

    it('devrait retourner null si le candidat n\'existe pas', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const result = await candidateService.validateCandidate(fakeId, {
        status: 'validated',
      });

      expect(result).toBeNull();
    });
  });

  describe('restoreCandidate', () => {
    it('devrait restaurer un candidat supprimé', async () => {
      const created = await candidateService.createCandidate(mockCandidate);
      await candidateService.deleteCandidate(created._id.toString());

      const result = await candidateService.restoreCandidate(created._id.toString());

      expect(result).toBeDefined();
      expect(result?.isDeleted).toBe(false);
      expect(result?.deletedAt).toBeUndefined();
    });

    it('devrait retourner null si le candidat n\'est pas supprimé', async () => {
      const created = await candidateService.createCandidate(mockCandidate);
      const result = await candidateService.restoreCandidate(created._id.toString());

      expect(result).toBeNull();
    });
  });

  describe('getCandidatesStats', () => {
    it('devrait retourner les statistiques des candidats', async () => {
      // Créer des candidats avec différents statuts
      await Candidate.create([
        mockCandidate,
        { ...mockCandidate, email: '1@example.com', status: 'pending' },
        { ...mockCandidate, email: '2@example.com', status: 'validated' },
        { ...mockCandidate, email: '3@example.com', status: 'validated' },
        { ...mockCandidate, email: '4@example.com', status: 'rejected' },
      ]);

      const stats = await candidateService.getCandidatesStats();

      expect(stats.pending).toBe(2);
      expect(stats.validated).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.total).toBe(5);
    });

    it('devrait retourner des statistiques vides si aucun candidat', async () => {
      const stats = await candidateService.getCandidatesStats();

      expect(stats.pending).toBe(0);
      expect(stats.total).toBe(0);
    });
  });
});
