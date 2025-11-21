# 🌊 DeepSea Archives - Guide d'Installation et d'Utilisation

## 📚 Table des matières

- [Stack Technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Lancement des microservices](#lancement-des-microservices)
- [Documentation API](#documentation-api)
- [Exemples de requêtes](#exemples-de-requêtes)
- [Tests](#tests)

---

## 🛠️ Stack Technique

- **Backend**: Express.js
- **ORM**: Prisma
- **Bases de données**: 
  - MySQL 8.0 (auth-service)
  - PostgreSQL 15 (observation-service, taxonomy-service)
- **Authentification**: JWT + rôles (USER, EXPERT, ADMIN)
- **Architecture**: Microservices (3 services)
- **Documentation**: Swagger/OpenAPI
- **Tests**: Jest + Supertest
- **Containerisation**: Docker + Docker Compose
- **Interface**: Postman / Swagger UI (pas de front-end requis)

---

## 🏗️ Architecture

Le projet est composé de **3 microservices** :

```
┌─────────────────┐
│   API Gateway   │ (Port 3000)
│  Point d'entrée │
└────────┬────────┘
         │
    ┌────┴────┬────────────────┬──────────────┐
    │         │                │              │
┌───▼────┐ ┌─▼──────────┐ ┌──▼─────────┐ ┌──▼──────────┐
│ MySQL  │ │auth-service│ │observation-│ │  taxonomy-  │
│        │ │ (Port 3001)│ │  service   │ │   service   │
└────────┘ └────────────┘ │(Port 3002) │ │ (Port 5002) │
                          └─────┬──────┘ └──────┬──────┘
                                │                │
                          ┌─────▼────────────────▼─────┐
                          │      PostgreSQL           │
                          └───────────────────────────┘
```

### 1. **auth-service** (Port 3001)
- Inscription et connexion des utilisateurs
- Gestion des rôles (USER, EXPERT, ADMIN)
- Génération et validation des JWT
- Administration des utilisateurs

### 2. **observation-service** (Port 3002)
- Gestion des espèces marines
- Soumission et validation des observations
- Système de réputation
- Calcul automatique de la rareté
- Soft delete et restauration

### 3. **taxonomy-service** (Port 5002)
- Analyse taxonomique des espèces
- Statistiques globales
- Classification hiérarchique
- Historisation des actions (audit)

---

## 📦 Installation

### Prérequis

- Node.js >= 18.x
- Docker & Docker Compose (recommandé)
- OU : MySQL 8.0 + PostgreSQL 15 (installation locale)

### Option 1 : Installation avec Docker (Recommandé)

1. **Cloner le repository**
```bash
git clone <votre-repo>
cd Deepsea
```

2. **Lancer les bases de données**
```bash
docker-compose up -d mysql postgres
```

3. **Installer les dépendances pour chaque service**
```bash
# Auth service
cd services/auth-service
npm install
npx prisma generate
npx prisma migrate deploy

# Observation service
cd ../observation-service
npm install
npx prisma generate
npx prisma migrate deploy

# Taxonomy service
cd ../taxonomy-service
npm install
npx prisma generate
npx prisma migrate deploy

# API Gateway
cd ../api-gateway
npm install
```

### Option 2 : Installation locale (sans Docker)

1. **Installer MySQL 8.0 et PostgreSQL 15**

2. **Créer les bases de données**
```sql
-- MySQL
CREATE DATABASE deepsea;

-- PostgreSQL
CREATE DATABASE madb;
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` dans chaque service :

**services/auth-service/.env**
```env
PORT=3001
DATABASE_URL="mysql://root:password123@localhost:3306/deepsea"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

**services/observation-service/.env**
```env
PORT=3002
DATABASE_URL="postgresql://saam:password123@localhost:5432/madb?schema=observation"
AUTH_SERVICE_URL=http://localhost:3001
```

**services/taxonomy-service/.env**
```env
PORT=5002
DATABASE_URL="postgresql://saam:password123@localhost:5432/madb?schema=taxonomy"
OBSERVATION_SERVICE_URL=http://localhost:3002
AUTH_SERVICE_URL=http://localhost:3001
```

**services/api-gateway/.env**
```env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
OBSERVATION_SERVICE_URL=http://localhost:3002
TAXONOMY_SERVICE_URL=http://localhost:5002
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

4. **Suivre les étapes d'installation des dépendances (étape 3 de l'option Docker)**

---

## 🚀 Lancement des microservices

### Avec Docker Compose (Tous les services)

```bash
# Lancer tous les services (BDD + microservices)
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down
```

### En mode développement (manuel)

Ouvrir **4 terminaux** différents :

**Terminal 1 - Auth Service**
```powershell
cd services/auth-service
npm run dev
# ✅ Auth service démarré sur http://localhost:3001
```

**Terminal 2 - Observation Service**
```powershell
cd services/observation-service
npm run dev
# ✅ Observation service démarré sur http://localhost:3002
```

**Terminal 3 - Taxonomy Service**
```powershell
cd services/taxonomy-service
npm run dev
# ✅ Taxonomy service démarré sur http://localhost:5002
```

**Terminal 4 - API Gateway (optionnel)**
```powershell
cd services/api-gateway
npm run dev
# ✅ API Gateway démarré sur http://localhost:3000
```

### Vérification du bon fonctionnement

```bash
# Test des health checks
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:5002/health
```

Réponse attendue : `{"status":"ok","service":"xxx-service"}`

---

## 📖 Documentation API

Chaque microservice expose sa documentation Swagger :

- **Auth Service**: http://localhost:3001/api-docs
- **Observation Service**: http://localhost:3002/api-docs
- **Taxonomy Service**: http://localhost:5002/api-docs

---

## 🧪 Exemples de requêtes

### 1. Inscription d'un utilisateur

**Requête cURL :**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"username\":\"oceanexplorer\",\"password\":\"SecurePass123!\"}"
```

**Requête PowerShell :**
```powershell
$body = @{
    email = "user@example.com"
    username = "oceanexplorer"
    password = "SecurePass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $body -ContentType "application/json"
```

**Réponse :**
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "oceanexplorer",
    "role": "USER"
  }
}
```

### 2. Connexion

**Requête cURL :**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"SecurePass123!\"}"
```

**Requête PowerShell :**
```powershell
$body = @{
    email = "user@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token
Write-Host "Token JWT: $token"
```

**Réponse :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "oceanexplorer",
    "role": "USER"
  }
}
```

**💡 Conservez le token JWT pour les requêtes suivantes !**

### 3. Créer une espèce

**Requête cURL :**
```bash
curl -X POST http://localhost:3002/species \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOTRE_TOKEN_JWT>" \
  -d "{\"name\":\"Leviathan Abyssal\",\"description\":\"Créature titanesque des profondeurs\",\"dangerLevel\":5,\"habitat\":\"Fosse des Mariannes\"}"
```

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "Leviathan Abyssal"
    description = "Créature titanesque des profondeurs"
    dangerLevel = 5
    habitat = "Fosse des Mariannes"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/species" -Method POST -Headers $headers -Body $body
```

**Réponse :**
```json
{
  "id": 1,
  "name": "Leviathan Abyssal",
  "authorId": 1,
  "rarityScore": 1.0,
  "createdAt": "2025-11-21T10:00:00.000Z"
}
```

### 4. Créer une observation

**Requête cURL :**
```bash
curl -X POST http://localhost:3002/observations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOTRE_TOKEN_JWT>" \
  -d "{\"speciesId\":1,\"description\":\"Observé à 8000m de profondeur, émettant une bioluminescence bleue intense\",\"location\":\"11°21 N 142°12 E\"}"
```

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    speciesId = 1
    description = "Observé à 8000m de profondeur, émettant une bioluminescence bleue intense"
    location = "11°21 N 142°12 E"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3002/observations" -Method POST -Headers $headers -Body $body
```

**Réponse :**
```json
{
  "id": 1,
  "speciesId": 1,
  "authorId": 1,
  "description": "Observé à 8000m de profondeur...",
  "status": "PENDING",
  "createdAt": "2025-11-21T10:05:00.000Z"
}
```

### 5. Valider une observation (EXPERT/ADMIN)

**Requête cURL :**
```bash
curl -X POST http://localhost:3002/observations/1/validate \
  -H "Authorization: Bearer <TOKEN_EXPERT_OU_ADMIN>"
```

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3002/observations/1/validate" -Method POST -Headers $headers
```

**Réponse :**
```json
{
  "id": 1,
  "status": "VALIDATED",
  "validatedBy": 2,
  "validatedAt": "2025-11-21T10:10:00.000Z",
  "message": "Observation validée. Réputation +3 (auteur), +1 (validateur expert)"
}
```

### 6. Rejeter une observation (EXPERT/ADMIN)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3002/observations/1/reject" -Method POST -Headers $headers
```

### 7. Obtenir toutes les espèces

**Requête cURL :**
```bash
curl -X GET http://localhost:3002/species \
  -H "Authorization: Bearer <VOTRE_TOKEN_JWT>"
```

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3002/species" -Method GET -Headers $headers
```

### 8. Trier les espèces par rareté

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3002/species?sortBy=rarityScore&order=desc" -Method GET -Headers $headers
```

### 9. Obtenir les statistiques taxonomiques

**Requête cURL :**
```bash
curl -X GET http://localhost:5002/taxonomy/stats \
  -H "Authorization: Bearer <VOTRE_TOKEN_JWT>"
```

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5002/taxonomy/stats" -Method GET -Headers $headers
```

**Réponse :**
```json
{
  "summary": {
    "totalSpecies": 15,
    "totalObservations": 42,
    "averageObservationsPerSpecies": 2.8
  },
  "occurrencesBySpecies": {
    "1": 12,
    "2": 8,
    "3": 5
  },
  "keywords": [
    { "keyword": "bioluminescent", "count": 18 },
    { "keyword": "abyssal", "count": 15 }
  ],
  "classification": [
    {
      "family": "Leviathan",
      "speciesCount": 3,
      "totalObservations": 25
    }
  ]
}
```

### 10. Lister tous les utilisateurs (ADMIN uniquement)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $tokenAdmin"
}

Invoke-RestMethod -Uri "http://localhost:3001/admin/users" -Method GET -Headers $headers
```

### 11. Modifier le rôle d'un utilisateur (ADMIN)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $tokenAdmin"
    "Content-Type" = "application/json"
}

$body = @{
    role = "EXPERT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/admin/users/1/role" -Method PATCH -Headers $headers -Body $body
```

### 12. Soft delete d'une observation (ADMIN)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $tokenAdmin"
}

Invoke-RestMethod -Uri "http://localhost:3002/observations/1/soft-delete" -Method PATCH -Headers $headers
```

### 13. Restaurer une observation (ADMIN)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $tokenAdmin"
}

Invoke-RestMethod -Uri "http://localhost:3002/observations/1/restore" -Method PATCH -Headers $headers
```

### 14. Historique des actions d'un utilisateur (ADMIN)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $tokenAdmin"
}

Invoke-RestMethod -Uri "http://localhost:5002/admin/user/1/history" -Method GET -Headers $headers
```

**Réponse :**
```json
{
  "userId": 1,
  "totalEvents": 15,
  "history": [
    {
      "id": 1,
      "type": "VALIDATE",
      "observationId": 5,
      "userId": 1,
      "createdAt": "2025-11-21T09:00:00.000Z"
    },
    {
      "id": 2,
      "type": "DELETE",
      "observationId": 3,
      "userId": 1,
      "createdAt": "2025-11-21T08:30:00.000Z"
    }
  ]
}
```

### 15. Historique d'une espèce (EXPERT/ADMIN)

**Requête PowerShell :**
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5002/expert/species/1/history" -Method GET -Headers $headers
```

---

## 🧪 Tests

Chaque microservice possède des tests unitaires avec Jest.

### Lancer tous les tests

```powershell
# Auth service
cd services/auth-service
npm test

# Observation service
cd services/observation-service
npm test

# Taxonomy service
cd services/taxonomy-service
npm test
```

### Tests avec couverture

```powershell
npm run test:coverage
```

---

## 📝 Collection Postman

Vous pouvez importer cette collection Postman pour tester rapidement l'API :

### Créer une collection Postman

1. **Créer une nouvelle collection** : "DeepSea Archives"

2. **Ajouter une variable d'environnement** :
   - Variable : `token`
   - Initial Value : (laisser vide)
   - Current Value : (sera rempli après login)

3. **Ajouter les requêtes suivantes** :

#### Dossier : Auth

1. **Register**
   - Method: POST
   - URL: `http://localhost:3001/auth/register`
   - Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "username": "testuser",
     "password": "Test123!"
   }
   ```

2. **Login**
   - Method: POST
   - URL: `http://localhost:3001/auth/login`
   - Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "Test123!"
   }
   ```
   - Tests (script pour sauvegarder le token):
   ```javascript
   pm.test("Save token", function () {
       var jsonData = pm.response.json();
       pm.environment.set("token", jsonData.token);
   });
   ```

3. **Get Me**
   - Method: GET
   - URL: `http://localhost:3001/auth/me`
   - Headers: `Authorization: Bearer {{token}}`

#### Dossier : Species

1. **Create Species**
   - Method: POST
   - URL: `http://localhost:3002/species`
   - Headers: `Authorization: Bearer {{token}}`
   - Body (raw JSON):
   ```json
   {
     "name": "Leviathan Abyssal",
     "description": "Créature titanesque",
     "dangerLevel": 5,
     "habitat": "Fosse des Mariannes"
   }
   ```

2. **Get All Species**
   - Method: GET
   - URL: `http://localhost:3002/species`
   - Headers: `Authorization: Bearer {{token}}`

#### Dossier : Observations

1. **Create Observation**
   - Method: POST
   - URL: `http://localhost:3002/observations`
   - Headers: `Authorization: Bearer {{token}}`
   - Body (raw JSON):
   ```json
   {
     "speciesId": 1,
     "description": "Observation détaillée",
     "location": "11°21 N 142°12 E"
   }
   ```

2. **Validate Observation**
   - Method: POST
   - URL: `http://localhost:3002/observations/1/validate`
   - Headers: `Authorization: Bearer {{token}}`

#### Dossier : Taxonomy

1. **Get Stats**
   - Method: GET
   - URL: `http://localhost:5002/taxonomy/stats`
   - Headers: `Authorization: Bearer {{token}}`

---

## 🎯 Fonctionnalités principales

### Système de réputation
- Observation validée : **+3 points**
- Observation rejetée : **-1 point**
- Validation effectuée par un EXPERT : **+1 point** supplémentaire
- À **10 points** de réputation → promotion automatique en **EXPERT**

### Calcul de la rareté
- Formule : `rarityScore = 1 + (nombreObservationsValidées / 5)`
- Plus une espèce a d'observations validées, plus elle est rare

### Règles métier
- ❌ Impossible de valider sa propre observation
- ❌ Impossible de soumettre 2 observations de la même espèce en moins de 5 minutes
- ❌ Impossible de créer 2 espèces avec le même nom
- ✅ Description obligatoire pour les observations
- ✅ dangerLevel doit être entre 1 et 5

---

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation Swagger : http://localhost:3001/api-docs
- Vérifiez les logs : `docker-compose logs -f`
- Vérifiez les variables d'environnement dans les fichiers `.env`

---

**Projet réalisé dans le cadre du cours Backend - Architecture Microservices**

