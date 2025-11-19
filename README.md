DeepSea Archives – Sujet de Projet Backend
DeepSea Archives est une plateforme où les utilisateurs répertorient des créatures abyssales imaginaires et soumettent des observations les concernant, tandis que des experts valident ou rejettent ces données.
Les espèces évoluent en fonction des observations collectées, simulant un écosystème sous-marin fictif.

Stack Technique
• Express.js
• Prisma ou Mongoose + Base de données
• JWT + rôles
• Microservices (2 obligatoires, d’autres possibles en bonus)
• Pas de front-end (utilisation de Postman et Swagger)

Par groupe de 2 (ou individuel, mais travail dense).
Le rendu sera un fichier .txt avec un lien GitHub/GitLab, avec un readme détaillé décrivant le travail effectué.
Chacun rendra un fichier texte, même si le lien du repo est le même. Les noms des membres du groupes doivent être clairement fournis.

DeepSea Archives
Notation Progressive

Niveau 10 / 20 – Base complète
Objectif
Mettre en place deux microservices fonctionnels, sécurisés, avec une logique métier simple mais cohérente.

1. Microservice 1 : auth-service
   Fonctionnalités minimales
   • POST /auth/register
   • POST /auth/login
   • GET /auth/me
   • Hash des mots de passe (bcrypt)
   • JWT pour l’authentification
   • Rôles : USER, EXPERT, ADMIN
   • Route réservée ADMIN : GET /admin/users
   • ADMIN peut modifier le rôle d’un utilisateur : PATCH /users/:id/role
   Modèle User
   id
   email
   username
   password
   role (USER | EXPERT | ADMIN)
   reputation
   createdAt

2. Microservice 2 : observation-service
   Fonctionnalités minimales
   Espèces
   • POST /species
   • GET /species/:id
   • GET /species
   Observations
   • POST /observations
   • GET /species/:id/observations
   Validation des observations
   • POST /observations/:id/validate
   • POST /observations/:id/reject
   Modèle Observation
   id
   speciesId
   authorId
   description
   status (PENDING | VALIDATED | REJECTED)
   validatedBy (null si PENDING)
   validatedAt (null si PENDING)
   createdAt
   Modèle Species
   id
   authorId
   name
   createdAt

Règles minimales
• Impossible de valider sa propre observation
• Impossible de soumettre deux observations de la même espèce dans un délai de cinq minutes
• Impossible de créer deux species du même nom
• Description obligatoire
• dangerLevel doit être compris entre 1 et 5
• JWT obligatoire pour toutes les opérations utilisateur

3. Communication entre microservices
   • observation-service doit vérifier le JWT provenant du auth-service

4. Documentation minimale
   • README expliquant l’installation
   • Instructions pour lancer les microservices
   • Exemples de requêtes Postman (ou équivalent)

5. Architecture soignée
   • Séparation en service layers

Niveau 13 / 20 – Intermédiaire
Objectif
Introduire des mécanismes supplémentaires simulant un écosystème simple et enrichissant la logique métier.

Fonctionnalités requises

1. Indice de rareté automatique
   Ajout de l’attribut rarityScore au model Species
   Formule :
   rarityScore = (1 + nombreObservationsValidées / 5)
   Possibilité de trier les espèces par rareté.

2. Système de réputation basique
   • Observation validée : +3
   • Observation rejetée : -1
   • Validation effectuée par un user au statut « expert » : +1
   • Un User avec une réputation de 10 devient « expert »

Niveau 16 / 20 – Avancé
Objectif
Ajout d’un troisième microservice.

1. Nouveau microservice : taxonomy-service
   Microservice dédié à l’analyse et à la classification des espèces.
   Il doit :
   • interroger observation-service pour récupérer espèces et observations,
   • organiser les espèces en :
   • familles,
   • sous-espèces,
   • branches évolutives,
   • générer et renvoyer des statistiques globales.
   Endpoint recommandé
   GET /taxonomy/stats
   Retourne par exemple :
   • nombre d’occurrences par espèce,
   • nombre moyen d’observations par espèce,
   • (optionnel) mots-clés récurrents des descriptions (analyse simple),
   • classification hiérarchique générée.

2. Modération avancée
   Étendre les fonctionnalités d’administration :
   • suppression logique (soft delete) d’observations,
   • historisation des validations, rejets, suppressions (historique fourni pour un user, et pour une specie)
   • GET /admin/user/:id/history
   • GET /expert/species/:id/history
   • restauration d’une observation supprimée par un ADMIN
   Toutes ces actions doivent respecter les rôles (EXPERT, ADMIN).

Niveau 18 à 20 / 20 – Expertise
Objectif
Produire une architecture professionnelle, automatisée et documentée.

1. API Gateway
   • point d’entrée unique
   • vérification du JWT
   • répartition des requêtes vers les microservices
   • ajout possible de logs ou de rate limiting

2. Dockerisation et CI simple
   • (optionnel) docker-compose pour l’ensemble du projet
   • pipeline CI (GitHub Actions, GitLab CI) intégrant :
   • installation
   • compilation
   • tests unitaires

3. Documentation complète
   • Swagger/OpenAPI
   • diagramme d’architecture
   • schéma de base de données (ex. Prisma ERD)

4. Tests unitaires
   Au minimum :
   • un test unitaire dans auth-service
   • un test unitaire dans observation-service
   • un test unitaire dans le troisième microservice
