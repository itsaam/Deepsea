# Architecture DeepSea Archives

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

## Évolutions futures

- [ ] Cache Redis pour sessions JWT
- [ ] WebSockets pour notifications temps réel
- [ ] Upload images vers S3/Cloud Storage
- [ ] Recherche full-text Elasticsearch
- [ ] Metrics avec Prometheus/Grafana
- [ ] Tracing distribué (Jaeger)
