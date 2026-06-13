#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ┌─────────────────────────────────────┐"
echo "  │        SafeStay Setup Script         │"
echo "  │   Student Safety Platform            │"
echo "  └─────────────────────────────────────┘"
echo -e "${NC}"

# ---- Check Node.js ----
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found.${NC}"
    echo "  Install from https://nodejs.org (v18+)"
    exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# ---- Navigate to project root ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- Check .env exists ----
if [ ! -f server/.env ]; then
    echo -e "${YELLOW}⚠  server/.env not found.${NC}"
    echo "  Copying from .env.example..."
    if [ -f server/.env.example ]; then
        cp server/.env.example server/.env
        echo -e "${YELLOW}  → Created server/.env from example.${NC}"
        echo -e "${YELLOW}  → Edit server/.env with your MongoDB URI and API keys.${NC}"
    else
        echo -e "${RED}  ✗ No .env.example found either. Create server/.env manually.${NC}"
    fi
fi

# ---- Install server dependencies ----
echo ""
echo -e "${BLUE}[1/4] Installing server dependencies...${NC}"
cd server
npm install --silent 2>&1 | tail -3
echo -e "${GREEN}✓ Server deps installed${NC}"

# ---- Install client dependencies ----
echo ""
echo -e "${BLUE}[2/4] Installing client dependencies...${NC}"
cd ../client
npm install --silent 2>&1 | tail -3
echo -e "${GREEN}✓ Client deps installed${NC}"

# ---- Seed database ----
echo ""
echo -e "${BLUE}[3/4] Seeding database...${NC}"
cd ../server
if grep -q "MONGO_URI" .env 2>/dev/null; then
    npx tsx src/scripts/seed.ts 2>&1 | tail -5 || echo -e "${YELLOW}⚠  Seed skipped (DB may already have data)${NC}"
else
    echo -e "${YELLOW}⚠  No MONGO_URI in .env — skipping seed${NC}"
fi

# ---- Done ----
echo ""
echo -e "${BLUE}[4/4] Setup complete!${NC}"
echo ""
echo -e "${GREEN}  To start the project, run:${NC}"
echo ""
echo -e "    ${YELLOW}bash start.sh${NC}"
echo ""
echo -e "  Or start servers manually:"
echo -e "    Terminal 1: ${YELLOW}cd server && npx tsx src/index.ts${NC}"
echo -e "    Terminal 2: ${YELLOW}cd client && npm run dev${NC}"
echo ""
echo -e "  Then open: ${BLUE}http://localhost:5173${NC}"
echo ""
