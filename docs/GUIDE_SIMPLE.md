# 🌊 Guide Simple - DeepSea Archives

## 🚪 L'API Gateway - Le Douanier

### AVANT (sans API Gateway) ❌

```
┌──────────────┐
│   Frontend   │
│ Port 5174    │
└──────┬───────┘
       │
       ├────────────> Auth Service (3001)        ❌ Pas de contrôle
       ├────────────> Observation Service (3002) ❌ Pas de contrôle
       └────────────> Taxonomy Service (5002)    ❌ Pas de contrôle
```

**Problèmes** :

- Chaque service vérifie le JWT séparément
- Pas de rate limiting
- Pas de logs centralisés
- Si un service change de port, il faut modifier partout

---

### MAINTENANT (avec API Gateway) ✅

```
┌──────────────┐
│   Frontend   │
│ Port 5174    │
└──────┬───────┘
       │
       │ Toutes les requêtes
       │ vers http://localhost:3000/api/...
       ▼
┌─────────────────────────────────────┐
│      🚪 API GATEWAY (Port 3000)     │
│           LE DOUANIER               │
│                                     │
│  ✓ Vérifie le JWT                  │
│  ✓ Rate limiting (100 req/15min)   │
│  ✓ Log toutes les requêtes         │
│  ✓ Gère les erreurs                │
└───────┬──────────┬──────────────────┘
        │          │
        ▼          ▼          ▼
     Auth(3001) Obs(3002) Taxo(5002)


┌─────────────────────────┐
│   👤 FRONTEND (5174)    │  ← Le client (interface utilisateur)
│     React + Vite        │
└───────────┬─────────────┘
            │
            │ Appelle http://localhost:3000/api/...
            │
            ▼
┌─────────────────────────┐
│  🚪 API GATEWAY (3000)  │  ← Le BOSS / Le douanier
│    Vérifie JWT          │
│    Redirige             │
└───────────┬─────────────┘
            │
            ├──────────────┬──────────────┐
            ▼              ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ 💼 Auth      │ │ 🐟 Observation│ │ 🔬 Taxonomy  │
    │  Service     │ │   Service     │ │   Service    │
    │  (3001)      │ │   (3002)      │ │   (5002)     │
    │              │ │               │ │              │
    │ SLAVE 1      │ │ SLAVE 2       │ │ SLAVE 3      │
    └──────┬───────┘ └──────┬────────┘ └──────┬───────┘
           │                │                  │
           ▼                ▼                  ▼
      MySQL DB        PostgreSQL          PostgreSQL
      (auth)          (observations)      (taxonomy)
```

**Avantages** :

- ✅ **1 seul point d'entrée** : Le frontend appelle uniquement le gateway
- ✅ **Sécurité centralisée** : JWT vérifié une seule fois
- ✅ **Protection** : Rate limiting pour éviter les abus
- ✅ **Flexibilité** : Si un service change, seul le gateway change

---

## 🧬 La Taxonomie - Classification des Animaux

C'est comme un **arbre généalogique des animaux** en biologie :

### Exemple : La Baleine Bleue 🐋

```
🌍 Phylum: Chordata
   (Tous les animaux avec une colonne vertébrale)
   │
   ├─ Humains
   ├─ Poissons
   └─ Mammifères
      │
      🦴 Class: Mammalia
         (Animaux à poils qui allaitent)
         │
         ├─ Chiens
         ├─ Chats
         └─ Cétacés
            │
            🐋 Order: Cetacea
               (Baleines et dauphins)
               │
               ├─ Dauphins
               └─ Baleines
                  │
                  🏠 Family: Balaenopteridae
                     (Rorquals)
                     │
                     └─ Différents rorquals
                        │
                        📝 Genus: Balaenoptera
                           │
                           └─ Species: Balaenoptera musculus
                              = BALEINE BLEUE 🐋
```

### Exemple : Le Grand Requin Blanc 🦈

```
🌍 Phylum: Chordata
   │
   🐟 Class: Chondrichthyes
      (Poissons cartilagineux - pas d'os)
      │
      🦈 Order: Lamniformes
         (Grands requins prédateurs)
         │
         🏠 Family: Lamnidae
            │
            📝 Genus: Carcharodon
               │
               └─ Species: Carcharodon carcharias
                  = GRAND REQUIN BLANC 🦈
```

---

## 🎯 Comment utiliser ton API Gateway

### 1. Démarrer tous les services

```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm run dev  # Port 3001

# Terminal 2 - Observation Service
cd services/observation-service
npm run dev  # Port 3002

# Terminal 3 - Taxonomy Service
cd services/taxonomy-service
npm run dev  # Port 5002

# Terminal 4 - API Gateway (LE DOUANIER)
cd services/api-gateway
npm run dev  # Port 3000 ✅

# Terminal 5 - Frontend
cd services/frontend
npm run dev  # Port 5174
```

### 2. Tester l'API Gateway

```bash
# Health check du gateway
curl http://localhost:3000/health

# Login via le gateway (route publique)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Récupérer les observations (route protégée)
curl http://localhost:3000/api/observations \
  -H "Authorization: Bearer TON_JWT_TOKEN"
```

### 3. Modifier le Frontend

Dans `services/frontend/src/services/api.js`, change :

**AVANT** :

```javascript
const API = axios.create({
  baseURL: "http://localhost:3002", // ❌ Appel direct au service
});
```

**APRÈS** :

```javascript
const API = axios.create({
  baseURL: "http://localhost:3000/api", // ✅ Passe par le gateway
});
```

---

## 📋 Routes disponibles via le Gateway

### Routes publiques (pas de JWT)

```
POST /api/auth/register      → Auth Service
POST /api/auth/login          → Auth Service
POST /api/auth/verify-2fa     → Auth Service
POST /api/auth/forgot-password → Auth Service
POST /api/auth/reset-password → Auth Service
```

### Routes protégées (JWT requis)

```
GET  /api/observations        → Observation Service
POST /api/observations        → Observation Service
GET  /api/species             → Observation Service
POST /api/species             → Observation Service
GET  /api/taxonomy            → Taxonomy Service
POST /api/phylum              → Taxonomy Service
POST /api/class               → Taxonomy Service
POST /api/order               → Taxonomy Service
POST /api/family              → Taxonomy Service
POST /api/genus               → Taxonomy Service
```

---

## 🔍 Anatomie d'une requête avec le Gateway

### Exemple : Créer une observation

```
1. Frontend envoie :
   POST http://localhost:3000/api/observations
   Headers: { Authorization: "Bearer abc123..." }
   Body: { speciesId: 1, latitude: 45.5, ... }

2. API Gateway reçoit la requête :
   ✓ Vérifie le JWT (valide ? expiré ?)
   ✓ Check rate limit (pas trop de requêtes ?)
   ✓ Log la requête

3. Gateway route vers :
   POST http://localhost:3002/observations
   (enlève le préfixe /api/)

4. Observation Service traite :
   - Crée l'observation
   - Retourne { id: 123, status: "PENDING", ... }

5. Gateway retourne la réponse au Frontend
```

---

## ⚠️ Erreurs courantes

### "Service indisponible"

```
❌ Le service ciblé n'est pas démarré
✅ Solution : Démarrer le service (ex: npm run dev)
```

### "Token invalide"

```
❌ JWT_SECRET différent entre gateway et services
✅ Solution : Même JWT_SECRET dans tous les .env
```

### "404 Not Found"

```
❌ Oubli du préfixe /api/
✅ Solution : http://localhost:3000/api/auth/login
            (pas http://localhost:3000/auth/login)
```

---

## 🎓 Pour résumer

1. **L'API Gateway** = Le douanier qui contrôle TOUTES les entrées
2. **Phylum/Class/Order...** = Classification scientifique des animaux (comme dans la vraie biologie)
3. **Tous les services passent par le gateway** = Architecture microservices professionnelle
4. **Le frontend appelle uniquement le gateway** = Plus simple et plus sécurisé

C'est comme un **aéroport** :

- Frontend = Passagers
- API Gateway = Contrôle de sécurité (passeport, bagages)
- Services = Différentes destinations (avions)

Tous les passagers DOIVENT passer par le contrôle de sécurité avant de prendre leur avion ! ✈️
