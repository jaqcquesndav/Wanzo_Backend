# 🚀 WANZO BACKEND - GUIDE DE DÉMARRAGE RAPIDE

## ⚡ Installation Rapide (Première fois)

### 1. Nettoyage Initial
```powershell
# Nettoyage complet du système Docker
docker system prune -af --volumes
```

### 2. Construction des Images de Base
```powershell
# Image de build (dépendances) - ~70 minutes
docker build -f Dockerfile.base --target wanzo-deps-base -t wanzo-deps-base .

# Image de production (runtime) - ~23 minutes  
docker build -f Dockerfile.base --target wanzo-production-base -t wanzo-production-base .
```

### 3. Build et Déploiement Complet
```powershell
# Build tous les services - ~8-10 minutes
docker-compose --profile prod build

# Déploiement complet de l'écosystème
docker-compose --profile prod up -d

# Vérification du statut
docker-compose --profile prod ps
```

---

## 🔄 Utilisation Quotidienne

### Démarrage Rapide
```powershell
# Démarrage de l'écosystème
docker-compose --profile prod up -d

# Vérification
docker-compose --profile prod ps
```

### Arrêt Propre
```powershell
# Arrêt de tous les services
docker-compose --profile prod down

# Arrêt avec suppression des volumes (ATTENTION!)
docker-compose --profile prod down -v
```

### Rebuild Service Spécifique
```powershell
# Rebuild d'un service modifié
docker-compose --profile prod build accounting-service
docker-compose --profile prod up -d --force-recreate accounting-service

# Vérification des logs
docker-compose --profile prod logs -f accounting-service
```

---

## 📊 Services & Ports

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **API Gateway** | 8000 | http://localhost:8000 | 🟢 |
| **Accounting** | 3003 | http://localhost:3003 | 🟢 |
| **Admin** | 3001 | http://localhost:3001 | 🟢 |
| **Analytics** | 3002 | http://localhost:3002 | 🟢 |
| **Customer** | 3011 | http://localhost:3011 | 🟢 |
| **Gestion Commerciale** | 3006 | http://localhost:3006 | 🟢 |
| **Portfolio** | 3005 | http://localhost:3005 | 🟢 |
| **PostgreSQL** | 5432 | localhost:5432 | 🟢 |
| **Kafka** | 9092 | localhost:9092 | 🟢 |
| **Prometheus** | 9090 | http://localhost:9090 | 🟢 |
| **Grafana** | 4000 | http://localhost:4000 | 🟢 |

---

## 🛠️ Commandes Utiles

### Monitoring
```powershell
# Status complet
docker-compose --profile prod ps

# Logs en temps réel
docker-compose --profile prod logs -f

# Logs service spécifique
docker-compose --profile prod logs -f accounting-service

# Utilisation des ressources
docker stats
```

### Debug
```powershell
# Accès au conteneur
docker exec -it kiota-accounting-service sh

# Test health check
docker-compose --profile prod exec accounting-service curl http://localhost:3001/health

# Inspection des images
docker images | findstr wanzo
```

### Maintenance
```powershell
# Nettoyage cache de build
docker builder prune -f

# Restart service spécifique
docker-compose --profile prod restart accounting-service

# Rebuild images de base (après changements dépendances)
docker build -f Dockerfile.base --target wanzo-deps-base -t wanzo-deps-base .
docker build -f Dockerfile.base --target wanzo-production-base -t wanzo-production-base .
```

---

## 🚨 Troubleshooting Rapide

### Service ne démarre pas
```powershell
# Vérifier les logs
docker logs kiota-[service-name] --tail 20

# Problème de module? -> Vérifier le CMD dans Dockerfile
# Problème de port? -> Vérifier docker-compose.yml
```

### Performance lente
```powershell
# Vérifier les ressources
docker stats

# Nettoyage si nécessaire
docker system prune -f
```

### Images de base obsolètes
```powershell
# Si erreur "wanzo-*-base:latest not found"
docker build -f Dockerfile.base --target wanzo-deps-base -t wanzo-deps-base .
docker build -f Dockerfile.base --target wanzo-production-base -t wanzo-production-base .
```

---

## 🎯 Performance Attendue

- **Premier build complet**: ~2 heures (images de base + services)
- **Rebuild incrémental**: ~5-10 minutes
- **Démarrage écosystème**: ~30-60 secondes
- **Consommation RAM**: ~4-6GB total
- **Consommation disque**: ~2.5GB (images + volumes)

---

## 📞 Support

Pour plus de détails, consultez `DOCKER_BUILD_ARCHITECTURE.md`

**🚀 Happy Coding!**
