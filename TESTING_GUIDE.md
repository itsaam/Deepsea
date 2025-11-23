# 🧪 Guide de Tests - DeepSea Archives

## 📋 Stratégie de Tests

### 🎯 Principe TDD (Test-Driven Development)

**OUI**, pour chaque nouvelle fonctionnalité, tu dois créer des tests **AVANT** ou **PENDANT** le développement.

## 🔧 Types de Tests

### 1️⃣ Tests Unitaires

**Quand** : Pour les fonctions utilitaires, services métier  
**Où** : `/tests/*.test.js` dans chaque service  
**Outils** : Jest

```bash
# Tester un service
cd services/auth-service
npm test

# Avec coverage
npm run test:coverage

# Mode watch (auto-reload)
npm run test:watch
```

### 2️⃣ Tests d'Intégration

**Quand** : Pour les endpoints API, interactions entre services  
**Où** : `/tests/integration/*.test.js`  
**Outils** : Jest + Supertest

### 3️⃣ Tests E2E (End-to-End)

**Quand** : Pour les parcours utilisateur complets  
**Où** : `/tests/e2e/*.test.js`  
**Outils** : Jest + Supertest + Socket.io-client

## 📁 Structure des Tests

```
services/auth-service/
├── src/
│   ├── services/
│   │   └── authService.js
│   └── controllers/
│       └── authController.js
└── tests/
    ├── unit/
    │   ├── authService.test.js       # Tests unitaires services
    │   └── hashUtils.test.js          # Tests utilitaires
    ├── integration/
    │   └── auth.integration.test.js   # Tests API endpoints
    └── e2e/
        └── auth.e2e.test.js           # Tests parcours complets
```

## 🚀 Tests Créés pour `shared/utils/`

✅ `tests/detectionSpam.test.js` (24 tests)  
✅ `tests/hashUtils.test.js` (7 tests)  
✅ `tests/gestionErreurs.test.js` (8 tests)

### Lancer les tests du module partagé

```bash
cd shared/utils
npm install  # Si pas encore fait
npm test
```

## 📝 Convention de Nommage

### Fichiers

- **Unitaire** : `nomFichier.test.js`
- **Intégration** : `nomFonctionnalité.integration.test.js`
- **E2E** : `nomParcours.e2e.test.js`

### Tests

```javascript
describe("NomModule - nomFonction()", () => {
  test("devrait faire X quand Y", () => {
    // Arrange
    const input = "test";

    // Act
    const result = maFonction(input);

    // Assert
    expect(result).toBe("attendu");
  });
});
```

## 🎯 Couverture de Code (Coverage)

**Objectif minimum** :

- Utilitaires partagés : **90%+**
- Services métier : **80%+**
- Controllers : **70%+**
- Routes : **60%+**

```bash
# Voir le coverage
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/lcov-report/index.html
```

## 🔄 Workflow pour Nouvelle Fonctionnalité

### Exemple : Ajouter système de badges

```bash
# 1. Créer le test AVANT le code
touch services/observation-service/tests/unit/badgeService.test.js

# 2. Écrire le test (qui échoue)
# describe("badgeService - attribuerBadge()")
# test("devrait attribuer badge 100 observations")

# 3. Lancer le test (il échoue ❌)
npm test

# 4. Écrire le code minimum pour que ça passe
# Créer badgeService.js

# 5. Relancer le test (il passe ✅)
npm test

# 6. Refactorer si nécessaire
# 7. Ajouter plus de cas de tests
```

## 🧪 Exemples de Tests par Type

### Test Unitaire (Service)

```javascript
// tests/unit/speciesService.test.js
const speciesService = require("../../src/services/speciesService");

describe("speciesService - createSpecies()", () => {
  test("devrait créer une nouvelle espèce", async () => {
    const data = {
      name: "Requin tigre",
      authorId: 1,
    };

    const species = await speciesService.createSpecies(data);

    expect(species).toHaveProperty("id");
    expect(species.name).toBe("Requin tigre");
  });
});
```

### Test d'Intégration (API)

```javascript
// tests/integration/species.integration.test.js
const request = require("supertest");
const app = require("../../src/index");

describe("POST /api/species", () => {
  test("devrait créer une espèce et retourner 201", async () => {
    const response = await request(app)
      .post("/api/species")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Raie manta",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Test E2E (Parcours)

```javascript
// tests/e2e/observation.e2e.test.js
describe("Parcours complet : Observation d'une espèce", () => {
  test("utilisateur crée espèce, soumet observation, reçoit validation", async () => {
    // 1. Créer espèce
    const species = await createSpecies();

    // 2. Soumettre observation
    const observation = await submitObservation(species.id);

    // 3. Validation par un autre user
    const validation = await validateObservation(observation.id);

    // 4. Vérifier réputation mise à jour
    const reputation = await getReputation();
    expect(reputation).toBeGreaterThan(initialReputation);
  });
});
```

## ⚠️ Bonnes Pratiques

### ✅ À FAIRE

- **Isoler les tests** : Chaque test doit être indépendant
- **Nettoyer la DB** : Utiliser `beforeEach` / `afterEach`
- **Mocker les API externes** : Ollama, auth-service, etc.
- **Tester les cas limites** : Valeurs nulles, limites, erreurs
- **Nommer clairement** : "devrait faire X quand Y"

### ❌ À ÉVITER

- Tests qui dépendent d'un ordre d'exécution
- Tests qui modifient la DB de production
- Tests trop longs (>5s par test unitaire)
- Dupliquer la logique métier dans les tests

## 🔧 Configuration Jest

Déjà configuré dans `package.json` de chaque service :

```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "testMatch": ["**/tests/**/*.test.js"]
  }
}
```

## 🚀 Commandes Utiles

```bash
# Tester tout le projet
./test-all.sh  # À créer

# Tester un service spécifique
cd services/auth-service && npm test

# Tester un fichier spécifique
npm test -- hashUtils.test.js

# Mode watch pendant le dev
npm run test:watch

# Coverage avec rapport HTML
npm run test:coverage
```

## 📊 CI/CD Integration

Ajouter dans `.github/workflows/tests.yml` :

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 🎯 Prochaines Étapes

1. ✅ **Lancer les tests du module partagé**

   ```bash
   cd shared/utils && npm test
   ```

2. **Améliorer les tests existants** dans les services

3. **Créer tests pour nouvelles fonctionnalités**

   - Suivre le cycle TDD
   - Viser 80%+ coverage

4. **Mettre en place CI/CD** pour exécuter les tests automatiquement

---

**Question** : Tu veux que je crée des tests pour un service spécifique (auth, observation, taxonomy) ou tu préfères commencer par tester le module `shared/utils/` que je viens de créer ?
