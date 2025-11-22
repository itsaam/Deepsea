# 🔍 Stack de Monitoring DeepSea Archives

Stack complète de centralisation des logs avec **Loki + Promtail + Grafana** pour tous les microservices DeepSea.

## 📋 Services inclus

- **Loki** (port 3100) - Stockage et agrégation des logs
- **Promtail** - Collecte automatique des logs Docker
- **Grafana** (port 3500) - Dashboard de visualisation

## 🚀 Démarrage rapide

### 1. Lancer la stack

```bash
cd /Users/saam/school/Deepsea/monitoring
docker-compose up -d
```

### 2. Vérifier que tout tourne

```bash
docker-compose ps
```

Vous devriez voir :

- ✅ loki (port 3100)
- ✅ promtail
- ✅ grafana (port 3500)

### 3. Accéder à Grafana

Ouvrir dans le navigateur : **http://localhost:3500**

**Identifiants :**

- Username : `admin`
- Password : `deepsea2024`

## 📊 Utilisation de Grafana

### Voir les logs en temps réel

1. Dans Grafana, cliquer sur **Explore** (icône boussole dans le menu gauche)
2. Sélectionner la datasource **Loki** (déjà configurée par défaut)
3. Utiliser les requêtes LogQL ci-dessous

### 🔎 Requêtes LogQL utiles

#### Tous les logs

```logql
{job="docker"}
```

#### Logs d'un service spécifique

```logql
{container_name="auth-service"}
{container_name="observation-service"}
{container_name="api-gateway"}
{container_name="ai-service"}
{container_name="taxonomy-service"}
```

#### Filtrer par niveau de log

```logql
# Uniquement les erreurs
{job="docker"} |= "error" or "ERROR"

# Warnings et erreurs
{job="docker"} |~ "(?i)(error|warn)"

# Logs INFO
{job="docker"} |= "INFO"
```

#### Rechercher un texte spécifique

```logql
# Rechercher "JWT" dans tous les logs
{job="docker"} |= "JWT"

# Rechercher les requêtes POST
{container_name="api-gateway"} |= "POST"

# Observer les analyses IA
{container_name="ai-service"} |= "analyse"
```

#### Logs d'un service compose

```logql
{compose_service="auth-service"}
```

#### Combiner plusieurs filtres

```logql
# Erreurs du service auth dans les 5 dernières minutes
{container_name="auth-service"} |= "error"
```

### ⏱️ Plage temporelle

En haut à droite de Grafana :

- **Last 5 minutes** - Logs récents
- **Last 1 hour** - Vue d'ensemble
- **Custom range** - Plage personnalisée

### 📈 Créer un Dashboard

1. Cliquer sur **+ → Dashboard**
2. Ajouter un panel de type **Logs**
3. Sélectionner **Loki** comme datasource
4. Entrer une requête LogQL
5. Sauvegarder

## 🔧 Configuration

### Microservices monitorés

Les logs sont automatiquement collectés pour :

- **api-gateway** (port 3000)
- **auth-service** (port 3001)
- **observation-service** (port 3002)
- **taxonomy-service** (port 5002)
- **ai-service** (port 3003)

### Rétention des logs

Par défaut : **7 jours** (168h)

Pour modifier, éditer `loki-config.yml` :

```yaml
limits_config:
  retention_period: 168h # Changer ici (en heures)
```

### Augmenter les performances

Si trop de logs, dans `loki-config.yml` :

```yaml
limits_config:
  max_query_parallelism: 64 # Augmenter pour plus de perf
```

## 🛑 Arrêter la stack

```bash
docker-compose down
```

Garder les données :

```bash
docker-compose down  # Volumes persistent automatiquement
```

Supprimer tout (logs inclus) :

```bash
docker-compose down -v
```

## 🐛 Dépannage

### Promtail ne collecte pas les logs

Vérifier les permissions Docker :

```bash
docker logs promtail
```

### Grafana n'affiche rien

1. Vérifier que Loki tourne :

```bash
curl http://localhost:3100/ready
# Doit retourner "ready"
```

2. Vérifier la connexion Loki → Grafana :

- Grafana → Configuration → Data Sources → Loki
- Cliquer sur **Test** (doit être vert)

### Voir les logs d'un container

```bash
docker logs loki
docker logs promtail
docker logs grafana
```

## 📦 Volumes Docker

- `loki-data` - Stockage des logs Loki
- `grafana-data` - Dashboards et config Grafana

Pour voir l'espace utilisé :

```bash
docker volume ls
docker system df -v
```

## 🔐 Sécurité

⚠️ **Configuration pour développement local uniquement !**

- Pas d'authentification Loki (auth_enabled: false)
- Grafana avec mot de passe simple
- Pas de HTTPS

Pour la production :

- Activer auth Loki
- Configurer HTTPS
- Changer le mot de passe Grafana
- Restreindre l'accès réseau

## 📚 Ressources

- [Documentation Loki](https://grafana.com/docs/loki/latest/)
- [Documentation Promtail](https://grafana.com/docs/loki/latest/clients/promtail/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

## ✨ Exemples d'utilisation avancés

### Compter les erreurs par service

```logql
sum by (container_name) (count_over_time({job="docker"} |= "error" [5m]))
```

### Voir les requêtes HTTP les plus lentes

```logql
{container_name="api-gateway"} | json | duration > 1000
```

### Tracer une requête spécifique

```logql
{job="docker"} |= "request_id=abc123"
```

## 🎯 Prochaines étapes

1. Créer des dashboards personnalisés pour chaque service
2. Configurer des alertes (erreurs > seuil)
3. Ajouter des métriques Prometheus (optionnel)
4. Intégrer avec des outils de tracing (Tempo)

---

**🌊 DeepSea Archives Monitoring Stack**  
_Tous vos logs au même endroit !_
