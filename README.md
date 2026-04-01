# Test 24h - Full Stack & Test Engineer

[![CI/CD Pipeline](https://github.com/votre-username/test-24h-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/votre-username/test-24h-fullstack/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/votre-username/test-24h-fullstack/branch/main/graph/badge.svg)](https://codecov.io/gh/votre-username/test-24h-fullstack)

Application full stack complète avec un module de gestion de candidats et une stratégie de tests exhaustive.

## 🚀 Stack Technique

### Backend
- **Node.js** + **Express** + **TypeScript**
- **MongoDB** avec **Mongoose**
- **JWT** pour l'authentification
- **Zod** pour la validation
- **Pino** pour les logs structurés
- **Rate limiting** avec express-rate-limit

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI
- **React Hook Form** pour les formulaires
- **React Router** pour la navigation
- **Axios** pour les appels API
- **MSW** pour le mocking des API

### Tests
- **Jest** + **Supertest** (backend)
- **Jest** + **Testing Library** + **axe-core** (frontend)
- **Playwright** pour les tests E2E
- **k6** pour les tests de performance

### DevOps
- **Docker** + **Docker Compose**
- **GitHub Actions** pour la CI/CD
- **Render** pour le déploiement

## 📁 Structure du Projet

```
./
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuration (DB, etc.)
│   │   ├── controllers/    # Contrôleurs
│   │   ├── middlewares/    # Middlewares (auth, rate limit, etc.)
│   │   ├── models/         # Modèles Mongoose
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Logique métier
│   │   ├── validators/     # Validation Zod
│   │   └── utils/          # Utilitaires
│   ├── tests/
│   │   ├── unit/           # Tests unitaires
│   │   ├── integration/    # Tests d'intégration
│   │   └── security/       # Tests de sécurité
│   └── Dockerfile
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── pages/          # Pages
│   │   ├── services/       # Services API
│   │   ├── types/          # Types TypeScript
│   │   └── msw/            # Mock Service Worker
│   ├── tests/
│   │   ├── unit/           # Tests unitaires
│   │   ├── accessibility/  # Tests d'accessibilité
│   │   └── e2e/            # Tests E2E Playwright
│   └── Dockerfile
├── performance/            # Tests de performance k6
├── .github/workflows/      # CI/CD GitHub Actions
├── docker-compose.yml
└── README.md
```

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour le développement local)

### Avec Docker Compose (Recommandé)

```bash
# Cloner le repository
git clone https://github.com/votre-username/test-24h-fullstack.git
cd test-24h-fullstack

# Démarrer tous les services
docker-compose up -d

# L'application sera disponible sur :
# - Frontend : http://localhost:5173
# - Backend API : http://localhost:3001
# - MongoDB : localhost:27017
```

### Développement Local

#### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Tests

### Backend
```bash
cd backend

# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests de sécurité
npm run test:security

# Avec couverture
npm run test -- --coverage
```

### Frontend
```bash
cd frontend

# Tous les tests
npm test

# Tests unitaires
npm run test:unit

# Tests d'accessibilité
npm run test:accessibility

# Tests E2E avec Playwright
npm run test:e2e

# Tests E2E avec UI
npm run test:e2e:ui
```

### Performance (k6)
```bash
# Test de charge sur POST /api/candidates
k6 run performance/load-test.js

# Test de l'endpoint de validation
k6 run performance/validation-test.js
```

## 📊 Stratégie de Tests

### Tests Unitaires (100% coverage services & modèles)
- Logique métier du backend
- Hooks et utilitaires du frontend

### Tests d'Intégration
- Endpoints API avec Supertest
- Base de données en mémoire

### Tests E2E (Playwright)
- Scénario complet : connexion → création → validation → suppression
- Tests sur Chrome, Firefox, Safari
- Tests responsive (mobile)

### Tests d'Accessibilité (axe-core)
- Vérification WCAG sur les pages principales
- Tests automatisés dans la CI

### Tests de Performance (k6)
- 500 requêtes simultanées sur POST /api/candidates
- Vérification du délai de 2 secondes sur la validation

### Tests de Sécurité
- Injection SQL/NoSQL
- Attaques brute force
- Validation des entrées
- Headers de sécurité

## 🔐 Authentification

Comptes de test :
- **Admin** : admin@test24h.com / Admin123!
- **Recruteur** : recruteur@test24h.com / Recruteur123!

## 📚 API Documentation

### Endpoints

#### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/refresh` - Rafraîchir le token

#### Candidats
- `GET /api/candidates` - Liste des candidats (pagination, filtres)
- `POST /api/candidates` - Créer un candidat
- `GET /api/candidates/:id` - Détails d'un candidat
- `PUT /api/candidates/:id` - Mettre à jour un candidat
- `DELETE /api/candidates/:id` - Supprimer un candidat (soft delete)
- `POST /api/candidates/:id/validate` - Valider/rejeter un candidat (2s de délai)
- `GET /api/candidates/stats` - Statistiques

## 🚀 Déploiement

### Sur Render

1. Créer un compte sur [Render](https://render.com)
2. Connecter votre repository GitHub
3. Créer les services :
   - **Web Service** pour le backend
   - **Static Site** pour le frontend
   - **MongoDB** (managed ou external)

4. Configurer les variables d'environnement

### Variables d'Environnement

#### Backend
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=votre-secret-jwt
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://votre-frontend.render.com
```

#### Frontend
```env
VITE_API_URL=https://votre-backend.render.com/api
```

## 📈 Monitoring

- **Logs** : Pino (backend) avec format JSON
- **Health Check** : Endpoint `/health`
- **Couverture de code** : Codecov
- **CI/CD** : GitHub Actions

## 🛡️ Sécurité

- Rate limiting sur toutes les routes
- Protection CORS configurée
- Headers de sécurité (Helmet)
- Validation Zod des entrées
- JWT avec expiration
- Soft delete pour les données

## 📝 License

MIT

---

**Développé avec ❤️ pour le Test 24h Full Stack & Test Engineer**
