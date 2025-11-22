#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}🛑 Arrêt de tous les services DeepSea...${NC}"
echo ""

# Lire les PIDs sauvegardés
if [ -f .pids ]; then
    PIDS=$(cat .pids)
    echo "Arrêt des processus : $PIDS"
    kill -9 $PIDS 2>/dev/null || true
    rm .pids
fi

# Tuer tous les processus sur les ports (au cas où)
echo "Nettoyage des ports 3000, 3001, 3002, 3003, 5002, 5174..."
lsof -ti:3000,3001,3002,3003,5002,5174 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Tous les services sont arrêtés !${NC}"
