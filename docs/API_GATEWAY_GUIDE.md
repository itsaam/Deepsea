# Guide d'utilisation de l'API Gateway - DeepSea Archives

## 🚀 Introduction

L'API Gateway est le **point d'entrée unique** pour toutes les requêtes vers les microservices DeepSea Archives. Il centralise l'authentification JWT, le rate limiting, et route intelligemment les requêtes vers les services appropriés.

---

## 📦 Installation et démarrage

### Prérequis

- Node.js 18+
- Les 3 microservices doivent être démarrés :
  - Auth Service (port 3001)
  - Observation Service (port 3002)
  - Taxonomy Service (port 5002)

### Configuration

Créer un fichier `.env` dans `services/api-gateway/` :

```env
PORT=3000
JWT_SECRET=votre_secret_jwt_super_securise

# URLs des services
AUTH_SERVICE_URL=http://localhost:3001
OBSERVATION_SERVICE_URL=http://localhost:3002
TAXONOMY_SERVICE_URL=http://localhost:5002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # 100 requêtes max
```

### Démarrage

```bash
cd services/api-gateway
npm install
npm run dev  # Mode développement avec nodemon
# ou
npm start    # Mode production
```

Le gateway démarre sur `http://localhost:3000`

---

## 🔐 Fonctionnalités

### 1. Point d'entrée unique

Toutes les requêtes passent par le gateway au lieu d'appeler directement les services.

**Avant (sans gateway)** :

```javascript
// Appels directs aux services
await axios.post("http://localhost:3001/auth/login", data);
await axios.get("http://localhost:3002/observations", { headers });
await axios.get("http://localhost:5002/taxonomy", { headers });
```

**Maintenant (avec gateway)** :

```javascript
// Tout passe par le gateway
await axios.post("http://localhost:3000/api/auth/login", data);
await axios.get("http://localhost:3000/api/observations", { headers });
await axios.get("http://localhost:3000/api/taxonomy", { headers });
```

### 2. Vérification JWT centralisée

Le gateway vérifie automatiquement les JWT pour les routes protégées :

```javascript
// Routes publiques (pas de JWT requis)
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-2fa
POST /api/auth/forgot-password
POST /api/auth/reset-password

// Routes protégées (JWT requis)
GET  /api/observations/*
POST /api/observations/*
GET  /api/species/*
GET  /api/taxonomy/*
...
```

Si le token est invalide/expiré :

```json
{
  "error": "Token invalide",
  "message": "Le token fourni n'est pas valide"
}
```

### 3. Rate Limiting

Protection contre les abus : **100 requêtes maximum par 15 minutes** par IP.

Si limite atteinte :

```json
{
  "error": "Trop de requêtes",
  "message": "Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard."
}
```

Headers de réponse :

```
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 1700000000
```

### 4. Logging automatique

Chaque requête est loggée avec :

- Timestamp
- Méthode HTTP
- URL
- IP du client

```
[2024-11-21T10:30:45.123Z] POST /api/auth/login - IP: ::1
[2024-11-21T10:30:46.456Z] GET /api/observations - IP: ::1
```

### 5. Gestion d'erreurs unifiée

Le gateway gère automatiquement :

**Service indisponible** :

```json
{
  "error": "Service indisponible",
  "message": "Le service demandé est temporairement indisponible"
}
```

**Timeout** :

```json
{
  "error": "Timeout",
  "message": "Le service a mis trop de temps à répondre"
}
```

**Route inexistante** :

```json
{
  "error": "Route non trouvée",
  "message": "La route GET /api/invalid n'existe pas"
}
```

---

## 📡 Routage des requêtes

### Mappage URL → Service

| Préfixe URL           | Service Cible       | Port | JWT Requis |
| --------------------- | ------------------- | ---- | ---------- |
| `/api/auth/*`         | Auth Service        | 3001 | ❌ Non     |
| `/api/observations/*` | Observation Service | 3002 | ✅ Oui     |
| `/api/species/*`      | Observation Service | 3002 | ✅ Oui     |
| `/api/taxonomy/*`     | Taxonomy Service    | 5002 | ✅ Oui     |
| `/api/phylum/*`       | Taxonomy Service    | 5002 | ✅ Oui     |
| `/api/class/*`        | Taxonomy Service    | 5002 | ✅ Oui     |
| `/api/order/*`        | Taxonomy Service    | 5002 | ✅ Oui     |
| `/api/family/*`       | Taxonomy Service    | 5002 | ✅ Oui     |
| `/api/genus/*`        | Taxonomy Service    | 5002 | ✅ Oui     |

### Exemple de flux

```
Client → POST /api/observations
   │
   ▼
API Gateway (localhost:3000)
   │
   ├─> Vérifier JWT ✓
   ├─> Check rate limit ✓
   ├─> Logger la requête ✓
   │
   ▼
Proxy vers http://localhost:3002/observations
   │
   ▼
Observation Service traite la requête
   │
   ▼
API Gateway retourne la réponse au client
```

---

## 🛠️ Utilisation dans le Frontend

### Configuration d'Axios

Mettre à jour `services/frontend/src/services/api.js` :

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api", // Point vers le gateway
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter le token JWT automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exemples d'utilisation
export const login = (credentials) => API.post("/auth/login", credentials);
export const getObservations = () => API.get("/observations");
export const getSpecies = () => API.get("/species");
export const getTaxonomy = () => API.get("/taxonomy");
```

### Avantages pour le Frontend

1. **URL unique** : Plus besoin de gérer plusieurs baseURL
2. **JWT automatique** : Le gateway vérifie, pas besoin de le faire côté service
3. **Erreurs cohérentes** : Format d'erreur unifié
4. **Rate limiting transparent** : Protection sans config frontend

---

## 🔍 Health Check

Vérifier que le gateway fonctionne :

```bash
curl http://localhost:3000/health
```

Réponse :

```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2024-11-21T10:30:45.123Z"
}
```

---

## 🐛 Debugging

### Vérifier les logs

Le gateway affiche :

- Toutes les requêtes entrantes
- Erreurs de proxy
- Timeouts et services indisponibles

```bash
npm run dev
# Logs en temps réel
[2024-11-21T10:30:45.123Z] POST /api/auth/login - IP: ::1
[Gateway Error] POST /api/observations: connect ECONNREFUSED 127.0.0.1:3002
```

### Erreurs courantes

**ECONNREFUSED** :

```
Le service cible n'est pas démarré.
→ Solution : Démarrer le service (ex: cd services/observation-service && npm run dev)
```

**Token invalide** :

```
Le JWT_SECRET dans .env doit être identique à celui des services.
→ Solution : Vérifier que JWT_SECRET est le même partout
```

**404 sur toutes les routes** :

```
Le préfixe /api est manquant.
→ Solution : Utiliser /api/auth/login au lieu de /auth/login
```

---

## 🧪 Tests

### Test manuel avec curl

**Route publique (login)** :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

**Route protégée (observations)** :

```bash
TOKEN="votre_jwt_token"
curl http://localhost:3000/api/observations \
  -H "Authorization: Bearer $TOKEN"
```

**Tester le rate limiting** :

```bash
# Envoyer 101 requêtes rapidement
for i in {1..101}; do
  curl http://localhost:3000/health
done
# La 101ème devrait retourner 429 Too Many Requests
```

---

## 📊 Métriques

### Rate Limiting Stats

Chaque réponse inclut des headers :

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1700000000
```

### Performance

- **Latency ajoutée** : ~5-10ms par requête
- **Timeout** : 30 secondes max par service
- **Mémoire** : ~50-100 MB

---

## 🚀 Déploiement en production

### Variables d'environnement

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=secret_complexe_en_production

# URLs services (IPs internes ou DNS)
AUTH_SERVICE_URL=http://auth-service:3001
OBSERVATION_SERVICE_URL=http://observation-service:3002
TAXONOMY_SERVICE_URL=http://taxonomy-service:5002

# Rate limiting plus strict
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

### Avec Docker Compose

```yaml
api-gateway:
  build: ./services/api-gateway
  ports:
    - "3000:3000"
  environment:
    - JWT_SECRET=${JWT_SECRET}
    - AUTH_SERVICE_URL=http://auth-service:3001
    - OBSERVATION_SERVICE_URL=http://observation-service:3002
    - TAXONOMY_SERVICE_URL=http://taxonomy-service:5002
  depends_on:
    - auth-service
    - observation-service
    - taxonomy-service
```

### Reverse Proxy (Nginx)

```nginx
upstream api_gateway {
  server localhost:3000;
}

server {
  listen 80;
  server_name api.deepsea.com;

  location / {
    proxy_pass http://api_gateway;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## 📚 Ressources

- [Documentation Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Axios](https://axios-http.com/)

---

## ✅ Checklist de migration

Pour migrer votre frontend vers l'API Gateway :

- [ ] Démarrer l'API Gateway (`npm run dev`)
- [ ] Mettre à jour `baseURL` dans le frontend : `http://localhost:3000/api`
- [ ] Tester l'authentification (login/register)
- [ ] Tester les routes protégées (observations, species, taxonomy)
- [ ] Vérifier que le JWT est bien envoyé dans les headers
- [ ] Tester le rate limiting (optionnel)
- [ ] Mettre à jour le README avec les nouvelles URLs

Une fois le gateway en place, plus besoin d'appeler directement les services ! 🎉
