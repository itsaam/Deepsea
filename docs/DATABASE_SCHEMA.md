# Schémas des bases de données - DeepSea Archives

## 📊 Vue d'ensemble

Le projet utilise 3 bases de données indépendantes :
- **Auth DB** (MySQL) - Gestion des utilisateurs et authentification
- **Observation DB** (PostgreSQL) - Observations et espèces marines
- **Taxonomy DB** (PostgreSQL) - Classification taxonomique

---

## 🔐 Auth Database (MySQL)

### Schéma ERD

```
┌─────────────────────────────────────────────────────────┐
│                         User                            │
├─────────────────────────────────────────────────────────┤
│ PK  id                    Int                           │
│     email                 String     @unique            │
│     username              String     @unique            │
│     password              String     (bcrypt hash)      │
│     role                  Role       DEFAULT USER       │
│     twoFactorEnabled      Boolean    DEFAULT false     │
│     twoFactorSecret       String?                       │
│     twoFactorCode         String?                       │
│     twoFactorExpires      DateTime?                     │
│     resetPasswordToken    String?    @unique            │
│     resetPasswordExpires  DateTime?                     │
│     createdAt             DateTime   @default(now())   │
│     updatedAt             DateTime   @updatedAt        │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐
│      Role        │
├──────────────────┤
│ - USER           │
│ - EXPERT         │
│ - ADMIN          │
└──────────────────┘
```

### Relations
Aucune relation interne. Les liens avec les autres services se font via `userId` stocké dans les autres bases.

### Index importants
- `email` (UNIQUE)
- `username` (UNIQUE)
- `resetPasswordToken` (UNIQUE)

---

## 🌊 Observation Database (PostgreSQL)

### Schéma ERD

```
┌─────────────────────────────────────────────────────────┐
│                       Species                           │
├─────────────────────────────────────────────────────────┤
│ PK  id                    Int                           │
│     scientificName        String     @unique            │
│     commonName            String                        │
│     description           String?                       │
│     habitat               String?                       │
│     distribution          String?                       │
│     conservationStatus    String?                       │
│     averageSize           String?                       │
│     lifespan              String?                       │
│     rarityScore           Float?                        │
│     deleted               Boolean    DEFAULT false     │
│     deletedBy             Int?                          │
│     deletedAt             DateTime?                     │
│     createdAt             DateTime   @default(now())   │
│     updatedAt             DateTime   @updatedAt        │
└─────────────────────────────────────────────────────────┘
                                │
                                │ 1
                                │
                                │
                                │ N
                                ▼
┌─────────────────────────────────────────────────────────┐
│                     Observation                         │
├─────────────────────────────────────────────────────────┤
│ PK  id                    Int                           │
│ FK  userId                Int                           │
│ FK  speciesId             Int                           │
│     latitude              Float                         │
│     longitude             Float                         │
│     depth                 Float?                        │
│     photo                 String?                       │
│     description           String?                       │
│     status                ObservationStatus             │
│     validatedBy           Int?                          │
│     validatedAt           DateTime?                     │
│     rejectionReason       String?                       │
│     deleted               Boolean    DEFAULT false     │
│     deletedBy             Int?                          │
│     deletedAt             DateTime?                     │
│     createdAt             DateTime   @default(now())   │
│     updatedAt             DateTime   @updatedAt        │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   ObservationStatus      │
├──────────────────────────┤
│ - PENDING                │
│ - VALIDATED              │
│ - REJECTED               │
└──────────────────────────┘
```

### Relations

1. **Species → Observations** (1:N)
   - Une espèce peut avoir plusieurs observations
   - `Observation.speciesId` → `Species.id`
   - Cascade : Restrict (ne pas supprimer species avec observations)

### Logique Soft Delete

#### Species
- `deleted = true` : Espèce masquée pour les users
- `deletedBy` : ID de l'admin/expert qui a supprimé
- `deletedAt` : Timestamp de suppression
- Restauration possible par ADMIN

#### Observations
- Suppression uniquement pour status VALIDATED ou REJECTED
- `deleted = true` : Observation archivée
- `deletedBy` : ID du user qui a supprimé
- Pas de restauration prévue

### Index importants
- `scientificName` (UNIQUE)
- `speciesId` sur Observation
- `userId` sur Observation
- `status` sur Observation
- `deleted` sur Species et Observation

---

## 🔬 Taxonomy Database (PostgreSQL)

### Schéma ERD

```
┌─────────────────────────────────┐
│            Phylum               │
├─────────────────────────────────┤
│ PK  id          Int             │
│     name        String  @unique │
│     description String?         │
│     createdAt   DateTime        │
│     updatedAt   DateTime        │
└─────────────────────────────────┘
              │
              │ 1
              │
              │ N
              ▼
┌─────────────────────────────────┐
│            Class                │
├─────────────────────────────────┤
│ PK  id          Int             │
│ FK  phylumId    Int             │
│     name        String          │
│     description String?         │
│     createdAt   DateTime        │
│     updatedAt   DateTime        │
├─────────────────────────────────┤
│ @@unique([name, phylumId])      │
└─────────────────────────────────┘
              │
              │ 1
              │
              │ N
              ▼
┌─────────────────────────────────┐
│            Order                │
├─────────────────────────────────┤
│ PK  id          Int             │
│ FK  classId     Int             │
│     name        String          │
│     description String?         │
│     createdAt   DateTime        │
│     updatedAt   DateTime        │
├─────────────────────────────────┤
│ @@unique([name, classId])       │
└─────────────────────────────────┘
              │
              │ 1
              │
              │ N
              ▼
┌─────────────────────────────────┐
│            Family               │
├─────────────────────────────────┤
│ PK  id          Int             │
│ FK  orderId     Int             │
│     name        String          │
│     description String?         │
│     createdAt   DateTime        │
│     updatedAt   DateTime        │
├─────────────────────────────────┤
│ @@unique([name, orderId])       │
└─────────────────────────────────┘
              │
              │ 1
              │
              │ N
              ▼
┌─────────────────────────────────┐
│            Genus                │
├─────────────────────────────────┤
│ PK  id          Int             │
│ FK  familyId    Int             │
│     name        String          │
│     description String?         │
│     createdAt   DateTime        │
│     updatedAt   DateTime        │
├─────────────────────────────────┤
│ @@unique([name, familyId])      │
└─────────────────────────────────┘
```

### Relations hiérarchiques

```
Phylum
  └── Class (N)
       └── Order (N)
            └── Family (N)
                 └── Genus (N)
```

Chaque niveau peut avoir plusieurs enfants du niveau inférieur.

### Contraintes d'unicité
- Phylum.name : Unique global
- Class.name : Unique par phylumId
- Order.name : Unique par classId
- Family.name : Unique par orderId
- Genus.name : Unique par familyId

### Exemple de données

```
Phylum: Chordata
  └── Class: Mammalia
       └── Order: Cetacea
            └── Family: Balaenopteridae
                 └── Genus: Balaenoptera
                      (Species: Balaenoptera musculus - Baleine bleue)
```

### Index importants
- Chaque niveau a un index sur le FK du parent
- Index composite sur (name, parentId)

---

## 🔄 Relations inter-bases

### Communication via IDs

```
┌──────────────┐
│  Auth DB     │
│  User.id     │────┐
└──────────────┘    │
                    │ userId (Int)
                    │
                    ▼
         ┌──────────────────┐
         │ Observation DB   │
         │ Observation      │
         │   - userId       │
         │   - validatedBy  │
         │   - deletedBy    │
         └──────────────────┘
```

**Note** : Pas de foreign keys entre bases différentes.
La validation des userId se fait au niveau applicatif.

---

## 📈 Calculs et algorithmes

### Score de rareté (Species.rarityScore)

```sql
rarityScore = 1 / (COUNT(observations) + 1)
```

Plus une espèce a d'observations, plus son score de rareté diminue.

### Système de réputation

**Règles** :
- Observation validée : +3 points
- Observation rejetée : -1 point
- Bonus si validateur est EXPERT : +1 point

**Auto-promotion** :
- À 10 points : USER → EXPERT (automatique)

**Implémentation** :
1. Observation service calcule les points
2. Appel à `auth-service` via `/internal/promote-expert`
3. Auth service met à jour `User.role`

---

## 🗄️ Scripts Prisma

### Générer les schémas visuels

```bash
# Auth Service
cd services/auth-service
npx prisma generate
npx prisma studio  # Visualiser les données

# Observation Service
cd services/observation-service
npx prisma generate
npx prisma studio

# Taxonomy Service
cd services/taxonomy-service
npx prisma generate
npx prisma studio
```

### Migrations

```bash
# Créer une migration
npx prisma migrate dev --name nom_migration

# Appliquer en production
npx prisma migrate deploy

# Reset complet (DEV ONLY)
npx prisma migrate reset
```

---

## 📊 Tailles et volumes estimés

### Auth DB
- Users : ~1000-10000 users
- Taille estimée : 10-50 MB

### Observation DB
- Species : ~500-2000 espèces
- Observations : ~10000-100000 observations
- Taille estimée : 100 MB - 1 GB (avec photos en URL)

### Taxonomy DB
- Total entries : ~500-1000 entrées
- Taille estimée : 5-10 MB

---

## 🔒 Sécurité des données

### Données sensibles
- **Passwords** : Bcrypt hash (10 rounds)
- **JWT Secret** : Variable d'environnement
- **2FA Codes** : Expiration 15 minutes
- **Reset Tokens** : Expiration 1 heure, unique

### Backup recommandé
- Auth DB : Quotidien (données critiques)
- Observation DB : Hebdomadaire
- Taxonomy DB : Mensuel (données stables)

---

## 📝 Notes techniques

### Choix MySQL vs PostgreSQL

**MySQL (Auth)** :
- Simple, relationnel classique
- Excellent pour lectures fréquentes (auth)
- Compatible Prisma

**PostgreSQL (Observation, Taxonomy)** :
- Meilleur pour données géospatiales (lat/long)
- JSON natif pour évolutions futures
- Transactions ACID robustes
- Extensions PostGIS possibles

### Optimisations futures
- [ ] Partitioning sur Observations par date
- [ ] Materialized views pour statistiques
- [ ] Full-text search sur Species
- [ ] Réplication read-replica pour scaling
