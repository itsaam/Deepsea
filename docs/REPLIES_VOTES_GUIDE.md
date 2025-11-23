# 💬 Système de Replies et Votes 🗳️

Système complet de commentaires (replies) et de votes pour les observations dans Deepsea.

## 🎯 Fonctionnalités

### Commentaires (Replies)

- ✅ Ajouter un commentaire sur une observation
- ✅ Modifier son propre commentaire
- ✅ Supprimer son commentaire (soft delete)
- ✅ Pagination des commentaires
- ✅ Protection : seul l'auteur ou admin peut modifier/supprimer

### Votes

- ✅ Upvote (+1) ou Downvote (-1) sur une observation
- ✅ Changer son vote à tout moment
- ✅ Retirer son vote
- ✅ Statistiques détaillées (score total, nombre de votes, upvotes, downvotes)
- ✅ Top des observations les mieux votées
- ✅ Protection : impossible de voter pour sa propre observation
- ✅ Un seul vote par utilisateur par observation

## 📋 Modèles Prisma

### Reply

```prisma
model Reply {
  id              Int       @id @default(autoincrement())
  observationId   Int
  authorId        Int
  content         String
  deleted         Boolean   @default(false)
  deletedBy       Int?
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  observation     Observation @relation(fields: [observationId], references: [id], onDelete: Cascade)
}
```

### Vote

```prisma
model Vote {
  id              Int       @id @default(autoincrement())
  observationId   Int
  userId          Int
  value           Int       // 1 pour upvote, -1 pour downvote
  createdAt       DateTime  @default(now())

  observation     Observation @relation(fields: [observationId], references: [id], onDelete: Cascade)

  @@unique([observationId, userId]) // Un user ne peut voter qu'une fois par observation
}
```

## 🚀 API Endpoints

### Replies

#### POST `/api/observations/:observationId/replies`

Ajouter un commentaire

```json
{
  "content": "Super observation !"
}
```

#### GET `/api/observations/:observationId/replies?page=1&limit=20`

Récupérer les commentaires (paginés)

#### PUT `/api/replies/:replyId`

Modifier son commentaire

```json
{
  "content": "Commentaire modifié"
}
```

#### DELETE `/api/replies/:replyId`

Supprimer son commentaire (soft delete)

---

### Votes

#### POST `/api/observations/:observationId/vote`

Voter pour une observation

```json
{
  "value": 1 // 1 = upvote, -1 = downvote
}
```

#### DELETE `/api/observations/:observationId/vote`

Retirer son vote

#### GET `/api/observations/:observationId/vote/stats`

Obtenir les statistiques de vote

```json
{
  "success": true,
  "stats": {
    "totalScore": 5,
    "totalVotes": 7,
    "upvotes": 6,
    "downvotes": 1,
    "userVote": 1
  }
}
```

#### GET `/api/observations/top?page=1&limit=10`

Obtenir les observations les mieux votées (triées par score décroissant)

## 🔒 Sécurité

- Authentification JWT requise sur tous les endpoints
- Un utilisateur ne peut voter qu'une fois par observation
- Impossible de voter pour sa propre observation
- Seul l'auteur ou un admin peut modifier/supprimer un commentaire
- Soft delete pour préserver l'historique
- Validation du contenu (max 1000 caractères)
- Protection contre le spam

## 🧪 Tester le système

```bash
# Démarrer les services
./start-all.sh

# Exécuter les tests
./test-replies-votes.sh
```

## 📊 Algorithme de Tri

Les observations sont triées par score :

- Score = (nombre d'upvotes) - (nombre de downvotes)
- Les observations avec le meilleur score apparaissent en premier
- Permet de faire émerger le contenu de qualité

## 🎨 Intégration Frontend

Exemple d'utilisation dans React :

```jsx
// Voter
const handleVote = async (observationId, value) => {
  const response = await axios.post(
    `/api/observations/${observationId}/vote`,
    { value },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(response.data.stats);
};

// Ajouter un commentaire
const handleComment = async (observationId, content) => {
  const response = await axios.post(
    `/api/observations/${observationId}/replies`,
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(response.data.reply);
};
```

## 💡 Fonctionnalités avancées possibles

- [ ] Notifications quand quelqu'un commente votre observation
- [ ] Réponses aux commentaires (nested replies)
- [ ] Badges pour les meilleurs contributeurs
- [ ] Filtres avancés (plus récents, plus votés, etc.)
- [ ] Système de signalement de commentaires abusifs
- [ ] Rich text dans les commentaires (markdown)

## 🐛 Debug

En cas de problème :

1. Vérifier que la migration Prisma est bien appliquée :

```bash
cd services/observation-service
npx prisma migrate status
```

2. Vérifier les logs du service :

```bash
docker-compose logs -f observation-service
```

3. Tester manuellement avec curl :

```bash
# Voter
curl -X POST http://localhost:3002/api/observations/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"value": 1}'
```

## 📝 Notes

- Les votes et replies sont supprimés automatiquement si l'observation est supprimée (CASCADE)
- Le soft delete permet de garder une trace des commentaires supprimés
- Les statistiques sont calculées en temps réel
- La pagination évite les problèmes de performance sur les observations populaires

---

**Développé avec 💙 pour Deepsea** 🌊
