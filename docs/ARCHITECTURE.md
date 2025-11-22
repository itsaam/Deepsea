# 🏗️ Architecture DeepSea Archives

## 📋 Table des matières

1. [Vue d'ensemble du système](#vue-densemble-du-système)
2. [Architecture des microservices](#architecture-des-microservices)
3. [Service Layer Pattern](#service-layer-pattern)
4. [Communication entre services](#communication-entre-services)
5. [Système de réputation](#système-de-réputation)
6. [Sécurité](#sécurité)
7. [Base de données](#base-de-données)
8. [Technologies](#technologies)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Déploiement](#déploiement)

---

## Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                      React + Vite + Tailwind                     │
│                       Port: 5174 (dev)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/HTTPS
                            │ JWT Token
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                               │
│                     Express.js - Port 3000                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Point d'entrée unique pour tous les services          │  │
│  │ • Vérification JWT centralisée                          │  │
│  │ • Rate limiting (100 req/15min)                         │  │
│  │ • Logging des requêtes                                  │  │
│  │ • Routage intelligent vers les microservices           │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────┬─────────────┬────────────────┬──────────────────────────┘
        │             │                │
        │             │                │
        ▼             ▼                ▼
┌──────────────┐ ┌────────────────┐ ┌──────────────────┐
│ Auth Service │ │ Observation    │ │ Taxonomy Service │
│ Port: 3001   │ │ Service        │ │ Port: 5002       │
│ Express.js   │ │ Port: 3002     │ │ Express.js       │
│              │ │ Express.js     │ │                  │
│ ┌──────────┐ │ │ ┌────────────┐ │ │ ┌──────────────┐ │
│ │ - Auth   │ │ │ │ - Obs CRUD │ │ │ │ - Taxonomy   │ │
│ │ - JWT    │ │ │ │ - Species  │ │ │ │   Management │ │
│ │ - 2FA    │ │ │ │ - Rareté   │ │ │ │ - Phylum     │ │
│ │ - Reset  │ │ │ │ - Réputa.  │ │ │ │ - Class      │ │
│ │ - Admin  │ │ │ │ - Soft Del │ │ │ │ - Order      │ │
│ └──────────┘ │ │ └────────────┘ │ │ │ - Family     │ │
│              │ │                │ │ │ - Genus      │ │
│      │       │ │       │        │ │ └──────────────┘ │
│      ▼       │ │       ▼        │ │        │         │
│ ┌──────────┐ │ │ ┌────────────┐ │ │  ┌────────────┐ │
│ │  MySQL   │ │ │ │ PostgreSQL │ │ │  │ PostgreSQL │ │
│ │  3306    │ │ │ │   5432     │ │ │  │   5433     │ │
│ │deepsea_  │ │ │ │deepsea_obs │ │ │  │deepsea_    │ │
│ │  auth    │ │ │ │            │ │ │  │ taxonomy   │ │
│ └──────────┘ │ │ └────────────┘ │ │  └────────────┘ │
└──────────────┘ └────────────────┘ └──────────────────┘
```

---

## Architecture des microservices

### 🌐 API Gateway (Port 3000)

**Responsabilités** :

- Point d'entrée unique pour toutes les requêtes client
- Vérification JWT centralisée
- Rate limiting (100 req/15min par IP)
- Logging et monitoring des requêtes
- Proxy intelligent vers les microservices

**Stack** :

- Express.js
- express-rate-limit
- http-proxy-middleware
- jsonwebtoken

**Structure** :

```
api-gateway/
├── src/
│   ├── index.js              # Point d'entrée
│   ├── config/
│   │   └── services.js       # Config URLs des services
│   ├── middlewares/
│   │   ├── jwtMiddleware.js  # Vérification JWT
│   │   └── rateLimitMiddleware.js
│   ├── routes/
│   │   └── gatewayRoutes.js  # Routage vers services
│   └── utils/
│       └── proxy.js          # Logique de proxy
└── package.json
```

### 🔐 Auth Service (Port 3001)

**Responsabilités** :

- Authentification (register, login)
- Gestion JWT (génération, validation)
- 2FA par email
- Reset password
- Gestion des rôles (USER/EXPERT/ADMIN)

**Stack** :

- Express.js
- Prisma ORM
- MySQL
- bcrypt
- nodemailer
- Swagger/OpenAPI

**Structure** :

```
auth-service/
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── jwt.js            # Config JWT
│   │   └── swagger.js        # Documentation API
│   ├── controllers/
│   │   ├── authController.js # Login, register, 2FA
│   │   └── adminController.js # Gestion users
│   ├── middlewares/
│   │   ├── authMiddleware.js # Vérif JWT
│   │   └── roleMiddleware.js # Vérif rôles
│   ├── routes/
│   │   ├── authRoutes.js     # Routes publiques
│   │   ├── adminRoutes.js    # Routes admin
│   │   └── internalRoutes.js # Inter-service
│   ├── services/             # 🎯 SERVICE LAYER
│   │   ├── authService.js    # Logique auth
│   │   ├── emailService.js   # Envoi emails
│   │   └── userService.js    # CRUD users
│   └── utils/
│       ├── hashUtils.js      # bcrypt wrapper
│       └── roulette.js       # Casino bonus
├── prisma/
│   ├── schema.prisma         # Schéma DB
│   └── migrations/
├── tests/
│   └── auth.test.js          # 25 tests
└── package.json
```

### 🐠 Observation Service (Port 3002)

**Responsabilités** :

- CRUD observations
- CRUD species
- Système de réputation
- Validation observations (EXPERT/ADMIN)
- Calcul rareté espèces
- Soft delete

**Stack** :

- Express.js
- Prisma ORM
- PostgreSQL
- Swagger/OpenAPI

**Structure** :

```
observation-service/
├── src/
│   ├── index.js
│   ├── config/
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── observationController.js
│   │   ├── reputationController.js
│   │   └── speciesController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── routes/
│   │   ├── observationRoutes.js
│   │   ├── reputationRoutes.js
│   │   └── speciesRoutes.js
│   ├── services/             # 🎯 SERVICE LAYER
│   │   ├── observationService.js # Logique observations
│   │   ├── reputationService.js  # Calcul réputation
│   │   └── speciesService.js     # Logique espèces
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   └── observation.test.js
└── package.json
```

### 🌳 Taxonomy Service (Port 5002)

**Responsabilités** :

- Gestion hiérarchie taxonomique (Phylum → Genus)
- Stats taxonomiques
- Recherche taxonomique

**Stack** :

- Express.js
- Prisma ORM
- PostgreSQL

**Structure** :

```
taxonomy-service/
├── src/
│   ├── index.js
│   ├── config/
│   ├── controllers/
│   │   └── taxonomyController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── routes/
│   │   └── taxonomyRoutes.js
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   └── taxonomy.test.js
└── package.json
```

### ⚛️ Frontend (Port 5174 dev)

**Responsabilités** :

- Interface utilisateur
- Authentification côté client
- Gestion d'état (Context API)
- Routing client-side

**Stack** :

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

**Structure** :

```
frontend/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx   # État auth global
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── Casino.jsx
│   │   ├── CreateSpecies.jsx
│   │   ├── ObservationsList.jsx
│   │   ├── SpeciesDetail.jsx
│   │   ├── SpeciesList.jsx
│   │   ├── Statistics.jsx
│   │   ├── Taxonomy.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   ├── services/
│   │   └── api.js            # Client HTTP
│   └── assets/
├── public/
└── package.json
```

---

## Service Layer Pattern

### 🎯 Architecture en couches

```
┌──────────────────────────────────────────┐
│              CLIENT REQUEST              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          ROUTES (Express Router)         │
│  • Définition endpoints                  │
│  • Validation requêtes (optionnel)       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         MIDDLEWARES (Auth, Role)         │
│  • JWT verification                      │
│  • Role-based access control             │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│           CONTROLLERS                    │
│  • Gestion requêtes HTTP                 │
│  • Validation entrées                    │
│  • Appel service layer                   │
│  • Formatage réponses                    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│        🎯 SERVICE LAYER 🎯               │
│  • Logique métier                        │
│  • Transactions complexes                │
│  • Orchestration entre entités           │
│  • Calculs et règles métier              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          PRISMA ORM / DATABASE           │
│  • Accès données                         │
│  • Requêtes SQL générées                 │
└──────────────────────────────────────────┘
```

### 📦 Services existants

#### Auth Service

**`authService.js`** :

- `hashPassword(password)` - Hash mot de passe avec bcrypt
- `comparePassword(password, hash)` - Vérification mot de passe
- `generateJWT(user)` - Génération token JWT
- `verifyToken(token)` - Validation token

**`emailService.js`** :

- `sendEmail(to, subject, html)` - Envoi email générique
- `send2FACode(email, code)` - Email code 2FA
- `sendResetPasswordEmail(email, token)` - Email reset password

**`userService.js`** :

- `createUser(data)` - Création utilisateur
- `getUserById(id)` - Récupération user
- `updateUserRole(userId, role)` - Mise à jour rôle
- `promoteToExpert(userId)` - Promotion automatique

#### Observation Service

**`observationService.js`** :

- `createObservation(data)` - Création observation
- `getObservations(filters)` - Liste observations
- `validateObservation(id, validatedBy)` - Validation par EXPERT
- `rejectObservation(id, reason)` - Rejet observation
- `softDeleteObservation(id, deletedBy)` - Suppression logique

**`reputationService.js`** :

- `calculateReputation(userId)` - Calcul points réputation
- `addReputationPoints(userId, points)` - Ajout points
- `checkAutoPromotion(userId)` - Vérif promotion auto (≥10 pts)

**`speciesService.js`** :

- `createSpecies(data)` - Création espèce
- `getSpecies(filters)` - Liste espèces
- `calculateRarityScore(speciesId)` - Calcul rareté
- `softDeleteSpecies(id, deletedBy)` - Suppression logique
- `restoreSpecies(id)` - Restauration (ADMIN)

---

## Communication entre services

### Routes publiques (via API Gateway)

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-2fa
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Routes protégées (JWT requis via API Gateway)

```
Observations:
  GET    /api/observations
  POST   /api/observations
  GET    /api/observations/:id
  PATCH  /api/observations/:id
  DELETE /api/observations/:id/soft-delete
  PATCH  /api/observations/:id/validate
  PATCH  /api/observations/:id/reject

Species:
  GET    /api/species
  POST   /api/species
  GET    /api/species/:id
  PUT    /api/species/:id
  DELETE /api/species/:id/soft-delete
  PATCH  /api/species/:id/restore

Taxonomy:
  GET    /api/taxonomy
  POST   /api/phylum
  GET    /api/phylum
  POST   /api/class
  GET    /api/class
  POST   /api/order
  GET    /api/order
  POST   /api/family
  GET    /api/family
  POST   /api/genus
  GET    /api/genus
```

## Communication inter-services

```
┌──────────────────┐      Internal Routes      ┌──────────────┐
│ Observation      │───────────────────────────>│ Auth Service │
│ Service          │  POST /internal/promote-   │              │
│                  │       expert               │              │
│ (Promotion auto) │                            │ (Update role)│
└──────────────────┘                            └──────────────┘
```

## Système de réputation

```
┌────────────────────────────────────────────────────────────┐
│                    FLUX DE RÉPUTATION                       │
└────────────────────────────────────────────────────────────┘

USER crée observation (status: PENDING)
        │
        ▼
EXPERT/ADMIN valide ──────> +3 points au USER
        │                    +1 bonus si validateur = EXPERT
        │
        ▼
    ≥10 points? ──YES──> Auto-promotion USER → EXPERT
        │                 (via internal route)
        NO
        │
        ▼
    Reste USER
```

## Sécurité

### Authentification

- **JWT** : Tokens signés avec secret partagé
- **2FA** : Code à 6 chiffres par email (15 min validité)
- **Rate Limiting** : 100 requêtes/15min par IP

### Autorisations (Roles)

```
ADMIN > EXPERT > USER

USER:
  - Créer observations
  - Voir ses propres observations
  - Modifier profil

EXPERT:
  - Tout de USER +
  - Valider/rejeter observations
  - Soft delete species
  - Créer species

ADMIN:
  - Tout de EXPERT +
  - Gérer utilisateurs
  - Restaurer entities soft-deleted
  - Accès admin panel
```

### Soft Delete

- Suppression logique (deleted=true, deletedBy, deletedAt)
- Observations : VALIDATED/REJECTED uniquement
- Species : cachées des users, visibles admin
- Restauration : ADMIN uniquement

## Base de données

### Auth DB (MySQL)

```
User
  - id, email, username, password (bcrypt)
  - role (USER/EXPERT/ADMIN)
  - twoFactorEnabled, twoFactorSecret, twoFactorCode
  - resetPasswordToken, resetPasswordExpires
  - createdAt, updatedAt
```

### Observation DB (PostgreSQL)

```
Observation
  - id, userId, speciesId
  - latitude, longitude, depth
  - photo, description
  - status (PENDING/VALIDATED/REJECTED)
  - validatedBy, validatedAt, rejectionReason
  - deleted, deletedBy, deletedAt
  - createdAt, updatedAt

Species
  - id, scientificName, commonName
  - description, habitat, distribution
  - conservationStatus, averageSize, lifespan
  - rarityScore
  - deleted, deletedBy, deletedAt
  - createdAt, updatedAt
```

### Taxonomy DB (PostgreSQL)

```
Phylum -> Class -> Order -> Family -> Genus

Chaque niveau:
  - id, name, description
  - parentId (référence niveau supérieur)
  - createdAt, updatedAt
```

## Technologies

### Backend

- **Node.js 18+** avec Express.js
- **Prisma ORM** pour MySQL et PostgreSQL
- **JWT** pour authentification
- **bcrypt** pour hashing mots de passe
- **nodemailer** pour emails 2FA

### Frontend

- **React 18** avec hooks
- **Vite** comme bundler
- **Tailwind CSS** pour styling
- **Axios** pour requêtes HTTP
- **React Router** pour navigation

### DevOps

- **Docker Compose** pour orchestration
- **GitHub Actions** CI/CD
- **Swagger/OpenAPI** pour documentation API
- **Jest + Supertest** pour tests

## Déploiement

### Development

```bash
# Démarrer tous les services
docker-compose up -d

# Ou individuellement
cd services/auth-service && npm run dev
cd services/observation-service && npm run dev
cd services/taxonomy-service && npm run dev
cd services/api-gateway && npm run dev
cd services/frontend && npm run dev
```

### Production

- API Gateway : Port 3000 (reverse proxy)
- Services backend : Ports internes (non exposés)
- Frontend : Build statique servi par CDN
- Bases de données : Instances managées

## CI/CD Pipeline

```
Push sur main/develop
    │
    ▼
GitHub Actions
    │
    ├─> API Gateway
    │   ├─ npm ci
    │   └─ npm test
    │
    ├─> Auth Service
    │   ├─ npm ci
    │   ├─ MySQL container
    │   ├─ prisma migrate
    │   └─ npm test (25 tests)
    │
    ├─> Observation Service
    │   ├─ npm ci
    │   ├─ PostgreSQL container
    │   ├─ prisma migrate
    │   └─ npm test
    │
    ├─> Taxonomy Service
    │   ├─ npm ci
    │   ├─ PostgreSQL container
    │   ├─ prisma migrate
    │   └─ npm test
    │
    └─> Frontend
        ├─ npm ci
        └─ npm run build
```

## Monitoring & Logs

### Logs

- API Gateway : Toutes requêtes avec timestamp, IP, méthode
- Services : Erreurs avec stack traces en dev
- Production : Logs structurés JSON

### Health Checks

```
GET /health sur chaque service
Response: { status: "ok", service: "nom", timestamp: "..." }
```

## Variables d'environnement

### API Gateway `.env`

```bash
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
OBSERVATION_SERVICE_URL=http://localhost:3002
TAXONOMY_SERVICE_URL=http://localhost:5002
JWT_SECRET=votre_secret_partagé
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requêtes max
```

### Auth Service `.env`

```bash
PORT=3001
DATABASE_URL=mysql://root:password@localhost:3306/deepsea_auth
JWT_SECRET=votre_secret_partagé
JWT_EXPIRES_IN=1d
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_app_password
```

### Observation Service `.env`

```bash
PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5432/deepsea_observation
JWT_SECRET=votre_secret_partagé
AUTH_SERVICE_URL=http://localhost:3001
```

### Taxonomy Service `.env`

```bash
PORT=5002
DATABASE_URL=postgresql://user:password@localhost:5433/deepsea_taxonomy
JWT_SECRET=votre_secret_partagé
```

---

## Patterns & Best Practices

### 🎯 Design Patterns utilisés

1. **Microservices Architecture**

   - Services indépendants et découplés
   - Communication via HTTP REST
   - Bases de données dédiées par service

2. **API Gateway Pattern**

   - Point d'entrée unique
   - Routage intelligent
   - Cross-cutting concerns (auth, rate limit)

3. **Service Layer Pattern**

   - Séparation logique métier / accès données
   - Réutilisabilité du code
   - Testabilité améliorée

4. **Repository Pattern** (via Prisma)

   - Abstraction accès données
   - Migrations automatiques
   - Type-safety

5. **Middleware Pattern** (Express)

   - Authentication
   - Authorization (RBAC)
   - Error handling
   - Logging

6. **Soft Delete Pattern**
   - Conservation données
   - Traçabilité (qui, quand)
   - Restauration possible

### ✅ Best Practices

- **Sécurité** : JWT avec expiration, bcrypt pour passwords, rate limiting
- **Validation** : Validation entrées utilisateur
- **Error Handling** : Try/catch systématique, messages d'erreur clairs
- **Logging** : Logs structurés, traçabilité des actions
- **Testing** : Tests unitaires et d'intégration
- **Documentation** : Swagger/OpenAPI pour les APIs
- **Git** : Commits atomiques, branches feature
- **CI/CD** : Tests automatiques sur chaque push
- **Environment** : Variables d'env pour config
- **Database** : Migrations versionnées avec Prisma

---

## Tests

### Coverage actuel

| Service             | Tests    | Coverage                              |
| ------------------- | -------- | ------------------------------------- |
| Auth Service        | 25 tests | ✅ Register, Login, 2FA, Reset, Admin |
| Observation Service | En cours | Observations, Species, Réputation     |
| Taxonomy Service    | En cours | Taxonomie, Stats                      |
| API Gateway         | À faire  | Rate limit, Proxy                     |

### Stack de tests

- **Jest** : Framework de tests
- **Supertest** : Tests API HTTP
- **MySQL/PostgreSQL in-memory** : Bases de test

---

## Métriques & Performance

### Rate Limiting

- **Fenêtre** : 15 minutes
- **Limite** : 100 requêtes
- **Scope** : Par IP

### Calcul requêtes

- **Créer observation** = 2 requêtes (POST + GET species)
- **Login** = 1 requête
- **Liste espèces** = 1 requête

### Database Indexing

- Index sur `email` (Auth)
- Index sur `userId`, `speciesId` (Observations)
- Index sur `status`, `deleted` (filtres fréquents)

---

## Évolutions futures

### Court terme (Sprint 1-2)

- [ ] Tests complets pour tous les services
- [ ] Validation Joi/Zod pour les entrées
- [ ] Error handling centralisé
- [ ] Logging structuré (Winston/Pino)
- [ ] Health checks endpoints

### Moyen terme (Sprint 3-5)

- [ ] Cache Redis pour sessions JWT
- [ ] Upload images vers S3/Cloud Storage
- [ ] Pagination sur toutes les listes
- [ ] Recherche full-text
- [ ] WebSockets pour notifications temps réel

### Long terme (Sprint 6+)

- [ ] Elasticsearch pour recherche avancée
- [ ] Message Queue (RabbitMQ) pour tâches async
- [ ] Metrics avec Prometheus/Grafana
- [ ] Tracing distribué (Jaeger/OpenTelemetry)
- [ ] API GraphQL en complément REST
- [ ] Mobile app (React Native)

---

## 📚 Documentation complémentaire

- [Installation Guide](../INSTALLATION_GUIDE.md)
- [API Gateway Guide](./API_GATEWAY_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Simple Guide](./GUIDE_SIMPLE.md)

---

## 👥 Équipe & Contact

**Projet** : DeepSea Archives - Plateforme collaborative pour la découverte d'espèces marines profondes

**Repository** : https://github.com/itsaam/Deepsea

**License** : MIT
