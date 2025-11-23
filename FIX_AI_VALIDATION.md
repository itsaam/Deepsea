# Fix : Validation AI des Observations

## 🐛 Problème Initial

L'utilisateur ne pouvait plus créer d'observations à cause de l'erreur :

```
❌ Erreur : Service de validation temporairement indisponible
Status HTTP: 503
```

## 🔍 Diagnostic

### Erreurs observées :

1. **Observation-service → AI-service** : Échec de l'appel à `/api/analyze`
2. **AI service** : Rejet des tokens JWT (`401 Unauthorized`)
3. **Frontend** : Multiples erreurs `401 Unauthorized` sur `/api/auth/me`, `/api/messages/keys`, etc.

### Cause racine :

Le fichier `.env` de l'**ai-service** ne contenait pas la variable `JWT_SECRET`, donc le middleware JWT ne pouvait pas valider les tokens envoyés par les autres services.

## ✅ Solution Appliquée

### 1. Ajout du JWT_SECRET dans ai-service/.env

```bash
# Avant
PORT=3003
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
NODE_ENV=development

# Après
PORT=3003
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
NODE_ENV=development
JWT_SECRET=deepsea_jwt_secret_key_2024  # ⬅️ AJOUTÉ
```

### 2. Redémarrage de l'AI service

```bash
cd /Users/saam/school/Deepsea/services/ai-service
lsof -ti :3003 | xargs kill -9
npm start
```

### 3. Vérification du fix

Test avec un token JWT valide :

```bash
curl -X POST http://localhost:3003/api/analyze \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"description":"test","speciesName":"Requin blanc"}'
```

**Résultat** : ✅ `Status HTTP: 200` (validation fonctionnelle)

## 🔧 Actions Requises pour l'Utilisateur

### ⚠️ IMPORTANT : Reconnexion nécessaire

Les erreurs `401 Unauthorized` dans le frontend indiquent que le token JWT de l'utilisateur est **expiré ou invalide**.

**Solution** :

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous** avec vos identifiants
3. Un nouveau token JWT valide sera généré (validité: 24h)
4. Testez la création d'une observation

## 🧪 Tests de Validation

Pour vérifier que tout fonctionne :

1. **Vérifier que les services sont démarrés** :

```bash
lsof -i :3002 -i :3003 | grep LISTEN
# Devrait montrer observation-service (3002) et ai-service (3003)
```

2. **Vérifier le JWT_SECRET dans ai-service** :

```bash
cd services/ai-service
grep JWT_SECRET .env
# Devrait afficher: JWT_SECRET=deepsea_jwt_secret_key_2024
```

3. **Lancer les tests** :

```bash
cd services/observation-service && npm test
cd services/ai-service && npm test
```

## 📊 Statut des Services

| Service             | Port | Status | JWT_SECRET |
| ------------------- | ---- | ------ | ---------- |
| auth-service        | 3001 | ✅     | ✅         |
| observation-service | 3002 | ✅     | ✅         |
| ai-service          | 3003 | ✅     | ✅ (FIXÉ)  |
| taxonomy-service    | 5002 | ✅     | ✅         |
| api-gateway         | 3000 | ✅     | ✅         |

## 🔐 Architecture de Sécurité

```
Frontend (React)
    ↓ JWT dans header Authorization
API Gateway (port 3000)
    ↓ Forward JWT
Observation Service (port 3002)
    ↓ Forward JWT
AI Service (port 3003)
    ✅ Valide JWT avec JWT_SECRET
```

## 📝 Leçons Apprises

1. **Tous les services** qui utilisent JWT doivent avoir `JWT_SECRET` dans leur `.env`
2. **Après modification d'un .env**, il faut **redémarrer le service**
3. **Les tokens JWT expirent** → Les utilisateurs doivent se reconnecter périodiquement
4. **TDD** : Les tests unitaires auraient pu détecter ce problème plus tôt

## ✨ Prochaines Étapes

- [ ] Ajouter un test d'intégration pour vérifier la communication observation-service → ai-service
- [ ] Implémenter un refresh token pour éviter les déconnexions fréquentes
- [ ] Ajouter un système de health check pour détecter les services mal configurés
- [ ] Documenter toutes les variables d'environnement requises pour chaque service

---

**Date du fix** : 23 novembre 2025  
**Développeur** : @itsaam  
**Status** : ✅ RÉSOLU
