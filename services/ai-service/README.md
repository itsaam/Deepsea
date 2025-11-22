# DeepSea AI Service 🤖🌊

Microservice d'intelligence artificielle pour DeepSea Archives utilisant Ollama et Llama 3.2.

## 🎯 Fonctionnalités

- **Analyse d'observations** : Validation automatique de la qualité des observations
- **Détection de spam** : Identification des contributions non sérieuses
- **Extraction de caractéristiques** : Analyse des traits biologiques des créatures
- **Classification taxonomique** : Suggestion de familles et ordres
- **Comparaison d'observations** : Détection de duplicatas
- **Résumés automatiques** : Génération de résumés concis

## 🚀 Installation

### Prérequis

- Node.js 18+
- Ollama installé et en cours d'exécution

### 1. Installer Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:3b
ollama serve
```

### 2. Installer le service

```bash
cd ai-service-deepsea
npm install
cp .env.example .env
npm start
```

Le service tourne sur `http://localhost:3003`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Analyser une observation
```bash
POST /api/analyze
Content-Type: application/json

{
  "description": "Créature translucide de 2m avec tentacules bioluminescents",
  "speciesName": "Cephalopodus luminaris"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "confidence": 87,
    "reason": "Description détaillée et cohérente",
    "isSpam": false,
    "qualityScore": 8,
    "recommendation": "VALIDATE",
    "detectedIssues": []
  }
}
```

### Détecter le spam
```bash
POST /api/detect-spam
Content-Type: application/json

{
  "description": "lol mdr creature bizarre"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "isSpam": true,
    "confidence": 92,
    "spamType": "low_effort",
    "reason": "Manque de détails scientifiques"
  }
}
```

### Extraire les caractéristiques
```bash
POST /api/extract-features
Content-Type: application/json

{
  "description": "Gigantesque poisson des profondeurs avec organes lumineux"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "size": "giant",
    "bioluminescence": true,
    "dangerLevel": 4,
    "estimatedDepth": "abyssal",
    "physicalTraits": ["organes lumineux", "taille imposante"],
    "behavioralTraits": [],
    "suggestedFamily": "Ceratiidae"
  }
}
```

### Suggérer une taxonomie
```bash
POST /api/suggest-taxonomy
Content-Type: application/json

{
  "description": "Crustacé blindé avec pinces massives",
  "speciesName": "Lobster giganteus"
}
```

### Comparer deux observations
```bash
POST /api/compare
Content-Type: application/json

{
  "description1": "Créature avec tentacules lumineux",
  "description2": "Organisme possédant des appendices bioluminescents"
}
```

### Résumer une observation
```bash
POST /api/summarize
Content-Type: application/json

{
  "description": "Très longue description détaillée..."
}
```

## 🐳 Docker

```bash
# Build
docker build -t deepsea-ai-service .

# Run
docker run -p 3003:3003 \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  deepsea-ai-service
```

## 🔗 Intégration avec Observation Service

Dans ton `observation-service`, appelle l'AI avant de créer une observation :

```javascript
const axios = require('axios');

// Analyser l'observation avec l'IA
const aiResponse = await axios.post('http://ai-service:3003/api/analyze', {
  description: req.body.description,
  speciesName: req.body.speciesName
});

const aiAnalysis = aiResponse.data.data;

// Auto-rejeter si spam détecté
if (aiAnalysis.isSpam) {
  return res.status(400).json({
    error: 'Observation rejected by AI: spam detected',
    reason: aiAnalysis.reason
  });
}

// Créer l'observation avec suggestion IA
const observation = await Observation.create({
  ...req.body,
  aiSuggestion: {
    recommendation: aiAnalysis.recommendation,
    confidence: aiAnalysis.confidence,
    qualityScore: aiAnalysis.qualityScore
  }
});
```

## 🧪 Tests

```bash
# Test avec curl
curl -X POST http://localhost:3003/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Méduse géante avec tentacules de 10m",
    "speciesName": "Medusa gigantea"
  }'
```

## 📊 Performance

- Temps de réponse moyen : 2-5 secondes (selon complexité du prompt)
- Mémoire utilisée : ~500MB (modèle 3B)
- CPU : 1-2 cores recommandés

## 🔧 Configuration

Variables d'environnement dans `.env` :

```env
PORT=3003
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
NODE_ENV=development
```

## 📝 Notes

- Le modèle `llama3.2:3b` est léger (3GB) et rapide
- Pour plus de précision, utilise `llama3.2:8b` (demande plus de RAM)
- Les réponses sont en français par défaut (adapte les prompts si besoin)

## 🎓 Auteurs

Abdelmalek Samy & Tristan Sanjuan - Projet DeepSea Archives
