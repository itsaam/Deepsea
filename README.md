# 🌊 DeepSea Archives – Plateforme d'Observation Marine

DeepSea Archives est une plateforme où les utilisateurs répertorient des créatures marines et soumettent des observations les concernant, tandis que des experts valident ou rejettent ces données.
Les espèces évoluent en fonction des observations collectées, avec un système de réputation et de classification taxonomique complète.

## 🚀 Stack Technique

- **Backend**: Express.js + Node.js 18+
- **Bases de données**: MySQL (Auth) + PostgreSQL (Observation/Taxonomy)
- **ORM**: Prisma
- **Authentification**: JWT + 2FA par email
- **Architecture**: Microservices (4 services) + API Gateway
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Documentation**: Swagger/OpenAPI sur tous les services
- **Tests**: Jest + Supertest
- **CI/CD**: GitHub Actions
- **Containerisation**: Docker + Docker Compose

## 📋 Documentation

### 📚 Documentation complète

- **[🏗️ ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Architecture complète du système
  - Vue d'ensemble microservices
  - Service Layer Pattern détaillé
  - Communication inter-services
  - Sécurité et authentification
  - CI/CD Pipeline
- **[📁 PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)** - Structure du projet
  - Arborescence complète
  - Organisation des fichiers
  - Conventions de nommage
  - Scripts disponibles
- **[🗄️ DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Schémas des bases de données
  - ERD complets
  - Relations entre tables
  - Migrations
- **[🚪 API_GATEWAY_GUIDE.md](./docs/API_GATEWAY_GUIDE.md)** - Guide API Gateway
  - Configuration du gateway
  - Rate limiting
  - JWT middleware
- **[📖 GUIDE_SIMPLE.md](./docs/GUIDE_SIMPLE.md)** - Guide simplifié

- **[⚙️ INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - Installation complète
