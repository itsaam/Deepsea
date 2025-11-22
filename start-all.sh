#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🌊 Démarrage de DeepSea Archives${NC}"
echo "===================================="
echo ""

# Fonction pour tuer les processus sur les ports
cleanup() {
    echo -e "${YELLOW}🧹 Nettoyage des ports...${NC}"
    lsof -ti:3000,3001,3002,3003,5002,5174 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Ports libérés${NC}"
}

# Cleanup au démarrage
cleanup

echo ""
echo -e "${BLUE}🚀 Lancement des services...${NC}"
echo ""

# Auth Service
echo -e "${GREEN}🔐 Démarrage Auth Service (3001)...${NC}"
cd services/auth-service
npm run dev >> ../../logs/auth-service.log 2>&1 &
AUTH_PID=$!
cd ../..

sleep 2

# Observation Service
echo -e "${GREEN}🐟 Démarrage Observation Service (3002)...${NC}"
cd services/observation-service
npm run dev >> ../../logs/observation-service.log 2>&1 &
OBS_PID=$!
cd ../..

sleep 2

# Taxonomy Service
echo -e "${GREEN}🔬 Démarrage Taxonomy Service (5002)...${NC}"
cd services/taxonomy-service
npm run dev >> ../../logs/taxonomy-service.log 2>&1 &
TAX_PID=$!
cd ../..

sleep 2

# AI Service
echo -e "${GREEN}🤖 Démarrage AI Service (3003)...${NC}"
cd services/ai-service
npm run dev >> ../../logs/ai-service.log 2>&1 &
AI_PID=$!
cd ../..

sleep 2

# API Gateway
echo -e "${GREEN}🚪 Démarrage API Gateway (3000)...${NC}"
cd services/api-gateway
npm run dev >> ../../logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
cd ../..

sleep 2

# Frontend
echo -e "${GREEN}⚛️  Démarrage Frontend (5174)...${NC}"
cd services/frontend
npm run dev >> ../../logs/frontend.log 2>&1 &
FRONT_PID=$!
cd ../..

sleep 3

echo ""
echo -e "${GREEN}✅ Tous les services sont démarrés !${NC}"
echo ""
echo "Services actifs :"
echo "  🔐 Auth Service      : http://localhost:3001"
echo "  🐟 Observation       : http://localhost:3002"
echo "  🔬 Taxonomy          : http://localhost:5002"
echo "  🤖 AI Service        : http://localhost:3003"
echo "  🚪 API Gateway       : http://localhost:3000"
echo "  ⚛️  Frontend          : http://localhost:5174"
echo ""
echo -e "${YELLOW}📝 PIDs des processus :${NC}"
echo "  Auth: $AUTH_PID | Obs: $OBS_PID | Tax: $TAX_PID | AI: $AI_PID | Gateway: $GATEWAY_PID | Front: $FRONT_PID"
echo ""
echo -e "${BLUE}Pour arrêter tous les services, fais : ./stop-all.sh${NC}"
echo ""

# Sauvegarder les PIDs pour pouvoir les arrêter plus tard
echo "$AUTH_PID $OBS_PID $TAX_PID $AI_PID $GATEWAY_PID $FRONT_PID" > .pids

# Garder le script actif
echo -e "${GREEN}✨ Appuie sur Ctrl+C pour tout arrêter${NC}"
trap cleanup EXIT

# Attendre indéfiniment
wait
