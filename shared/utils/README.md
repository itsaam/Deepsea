# 📦 @deepsea/shared-utils

Module centralisé d'utilitaires partagés entre tous les microservices DeepSea.

## 🎯 Objectif

Éliminer la duplication de code en centralisant les fonctionnalités communes utilisées par plusieurs services.

## 📁 Structure

```
shared/utils/
├── index.js                 # Point d'entrée principal
├── detectionSpam.js         # Détection spam & validation contenu
├── hashUtils.js             # Hachage bcrypt
├── gestionErreurs.js        # Gestion erreurs controllers
├── authServiceClient.js     # Client HTTP vers auth-service
└── package.json             # Métadonnées du module
```

## 🔧 Utilisation

### Import depuis un service

```javascript
// Import d'un utilitaire spécifique
const { detecterSpam } = require("../../../shared/utils/detectionSpam");

// Import de plusieurs utilitaires
const {
  hashPassword,
  gererErreurController,
} = require("../../../shared/utils");
```

### Détection de spam

```javascript
const {
  detecterSpam,
  validerContenuCommentaire,
} = require("@deepsea/shared-utils");

// Vérifier si un texte est du spam
const spamCheck = detecterSpam("aaaaaa", 10);
if (spamCheck.isSpam) {
  console.log(`Spam détecté: ${spamCheck.raison}`);
}

// Valider un commentaire
const validation = validerContenuCommentaire("Commentaire valide ici");
if (!validation.valide) {
  return res.status(400).json({ error: validation.erreur });
}
```

### Hachage de mots de passe

```javascript
const { hashPassword, comparePassword } = require("@deepsea/shared-utils");

// Hasher un mot de passe
const hash = await hashPassword("MonMotDePasse123!");

// Vérifier un mot de passe
const isValid = await comparePassword("MonMotDePasse123!", hash);
```

### Gestion des erreurs

```javascript
const {
  gererErreurController,
  avecGestionErreur,
} = require("@deepsea/shared-utils");

// Méthode 1: Gestion manuelle
async function monController(req, res) {
  try {
    // Code métier...
    return res.json({ success: true });
  } catch (erreur) {
    return gererErreurController(erreur, res, "mon action");
  }
}

// Méthode 2: Wrapper automatique
router.post(
  "/action",
  avecGestionErreur(async (req, res) => {
    // Code métier sans try/catch
    return res.json({ success: true });
  }, "mon action")
);
```

### Client Auth Service

```javascript
const {
  recupererInfosUtilisateur,
  viderCacheUtilisateur,
} = require("@deepsea/shared-utils");

// Récupérer infos utilisateur (avec cache 5min)
const user = await recupererInfosUtilisateur(123);

// Vider le cache après update
viderCacheUtilisateur(123);
```

## 🧪 Tests

```bash
cd shared/utils
npm test
```

## 📋 Modules disponibles

### `detectionSpam.js`

- `detecterSpam(texte, longueurMin)` - Détecte spam
- `validerContenuCommentaire(contenu)` - Valide commentaire
- `calculerScoreQualite(texte)` - Score 0-10

### `hashUtils.js`

- `hashPassword(password)` - Hash bcrypt
- `comparePassword(plain, hash)` - Vérifie hash

### `gestionErreurs.js`

- `gererErreurController(erreur, res, contexte)` - Gère erreurs
- `avecGestionErreur(fonctionAsync, contexte)` - Wrapper async

### `authServiceClient.js`

- `recupererInfosUtilisateur(userId)` - Récupère user avec cache
- `viderCacheUtilisateur(userId?)` - Vide cache
- `recupererPlusieursUtilisateurs(userIds[])` - Récupère plusieurs users

## 🔄 Services utilisant ce module

- ✅ **auth-service** : hashUtils, gestionErreurs
- ✅ **observation-service** : authServiceClient, detectionSpam
- ✅ **ai-service** : detectionSpam
- ✅ **taxonomy-service** : (futur)
- ✅ **api-gateway** : (futur)

## 📝 Conventions

- Tous les commentaires en **français**
- Logs avec `console.error` pour erreurs
- Fonctions async pour toutes les opérations I/O
- Exports explicites via `module.exports`

## 🚀 Ajout d'un nouvel utilitaire

1. Créer `monUtilitaire.js` dans `/shared/utils/`
2. Exporter via `module.exports`
3. Ajouter export dans `index.js`
4. Documenter dans ce README
5. Supprimer les versions locales dans les services
6. Mettre à jour les imports

## 🎨 Avantages

- ✅ **DRY** : Une seule source de vérité
- ✅ **Maintenance** : Un seul endroit à modifier
- ✅ **Cohérence** : Comportement identique partout
- ✅ **Tests** : Un seul module à tester
- ✅ **Performance** : Cache centralisé

---

**Maintenu par** : @itsaam  
**Version** : 1.0.0  
**Dernière mise à jour** : 23 novembre 2025
