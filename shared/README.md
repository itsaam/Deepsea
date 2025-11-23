# 🤝 DeepSea Shared Resources

Ressources partagées entre tous les microservices du projet DeepSea.

## 📁 Structure

```
shared/
├── utils/          # Utilitaires JavaScript partagés
│   ├── detectionSpam.js
│   ├── hashUtils.js
│   ├── gestionErreurs.js
│   ├── authServiceClient.js
│   └── README.md
└── README.md       # Ce fichier
```

## 🎯 Objectif

Centraliser le code réutilisable pour respecter le principe **DRY** (Don't Repeat Yourself) et faciliter la maintenance.

## 🔧 Utilisation

Chaque service peut importer les utilitaires partagés via des chemins relatifs :

```javascript
// Depuis un service (ex: auth-service)
const { hashPassword } = require("../../../shared/utils/hashUtils");

// Depuis un contrôleur (ex: auth-service/src/controllers/)
const {
  gererErreurController,
} = require("../../../../shared/utils/gestionErreurs");
```

## 📦 Modules disponibles

### `utils/` - Utilitaires JavaScript

Module npm `@deepsea/shared-utils` contenant :

- **detectionSpam.js** : Anti-spam et validation de contenu
- **hashUtils.js** : Hachage bcrypt pour mots de passe
- **gestionErreurs.js** : Gestion d'erreurs pour controllers Express
- **authServiceClient.js** : Client HTTP vers auth-service avec cache

[Documentation complète](./utils/README.md)

## 🚀 Ajout de nouvelles ressources partagées

### Créer un nouvel utilitaire

1. Créer le fichier dans `shared/utils/`
2. Exporter via `module.exports`
3. Ajouter à `utils/index.js`
4. Documenter dans `utils/README.md`
5. Supprimer les copies locales des services
6. Mettre à jour les imports

### Créer d'autres types de ressources partagées

Exemples de dossiers à créer si nécessaire :

```
shared/
├── middlewares/    # Middlewares Express réutilisables
├── configs/        # Configurations communes
├── constants/      # Constantes partagées
├── types/          # Types TypeScript (si migration)
└── schemas/        # Schémas de validation Joi/Yup
```

## ✅ Services connectés

- ✅ **auth-service** : hashUtils, gestionErreurs
- ✅ **observation-service** : authServiceClient, detectionSpam
- ✅ **ai-service** : detectionSpam
- ⏸️ **taxonomy-service** : Futur
- ⏸️ **api-gateway** : Futur

## 📝 Conventions

- Tous les commentaires en **français**
- Code style : camelCase pour variables/fonctions
- Exports explicites via `module.exports`
- Documentation JSDoc pour toutes les fonctions publiques

## 🎨 Avantages

- ✅ Élimine la duplication de code
- ✅ Facilite la maintenance (1 seul endroit à modifier)
- ✅ Garantit la cohérence entre services
- ✅ Simplifie les tests (1 seul module à tester)
- ✅ Améliore la qualité du code (DRY + KISS)

---

**Maintenu par** : @itsaam  
**Version** : 1.0.0  
**Dernière mise à jour** : 23 novembre 2025
