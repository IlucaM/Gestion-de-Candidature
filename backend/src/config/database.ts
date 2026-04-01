import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Configuration et connexion à MongoDB
 */

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test24h';
    
    await mongoose.connect(mongoURI);
    
    logger.info('Connexion MongoDB établie avec succès');
  } catch (error) {
    logger.error({ error }, 'Erreur de connexion à MongoDB');
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Déconnexion MongoDB réussie');
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la déconnexion MongoDB');
  }
};

export default connectDB;
