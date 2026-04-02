import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

import connectDB from './config/database';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';

// Importer les routes
import authRoutes from './routes/authRoutes';
import candidateRoutes from './routes/candidateRoutes';

/**
 * Application Express principale
 */

const app: Application = express();
const PORT = process.env.PORT ?? 3001;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, '').toLowerCase();

app.use(
  cors({
    origin: (origin, callback) => {
      const configuredOrigin = process.env.FRONTEND_URL;

      // Allow requests without origin (e.g. curl, mobile apps, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      // In development, allow localhost on any port
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }

      // Allow any onrender.com subdomain (Render deployments)
      if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin)) {
        callback(null, true);
        return;
      }

      // If FRONTEND_URL is configured, allow only that origin (normalized comparison)
      if (configuredOrigin && normalizeUrl(origin) === normalizeUrl(configuredOrigin)) {
        callback(null, true);
        return;
      }

      // Fallback for local frontend default
      if (!configuredOrigin && origin === 'http://localhost:5173') {
        callback(null, true);
        return;
      }

      logger.warn({ origin, configuredOrigin }, 'Requête CORS bloquée');
      callback(new Error('Non autorisé par la politique CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting général
app.use(generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

// Route racine
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Bienvenue sur l'API Test 24h - Full Stack",
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      candidates: '/api/candidates',
    },
  });
});

// Gestion des routes non trouvées
app.use(notFoundHandler);

// Gestion globale des erreurs
app.use(errorHandler);

// Démarrer le serveur
const startServer = async (): Promise<void> => {
  try {
    // Connexion à la base de données
    await connectDB();

    // Démarrer le serveur
    app.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV ?? 'development'}`);
    });
  } catch (error) {
    logger.error({ error }, 'Erreur lors du démarrage du serveur');
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Exception non capturée');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Promesse rejetée non gérée');
  process.exit(1);
});

// Démarrer le serveur
void startServer();

export default app;
