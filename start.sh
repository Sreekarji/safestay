#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}Starting SafeStay...${NC}"

# Kill any existing processes on our ports
lsof -ti:5000 2>/dev/null | xargs kill 2>/dev/null || true
lsof -ti:5173 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

# Start backend
echo -e "${GREEN}[1/2] Starting backend on :5000${NC}"
cd server
npx tsx src/index.ts &
SERVER_PID=$!
cd ..

# Wait for backend to be ready
echo -n "  Waiting for backend"
for i in $(seq 1 15); do
    if curl -s --max-time 2 http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Start frontend
echo -e "${GREEN}[2/2] Starting frontend on :5173${NC}"
cd client
npm run dev &
CLIENT_PID=$!
cd ..

# Wait for frontend
sleep 3
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}SafeStay is running!${NC}"
echo -e ""
echo -e "  Frontend:  ${BLUE}http://localhost:5173${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:5000/api${NC}"
echo -e ""
echo -e "  Login:"
echo -e "    Student:  rahul@iiit.ac.in / Password123!"
echo -e "    Owner:    owner1@example.com / Password123!"
echo -e ""
echo -e "  Press Ctrl+C to stop both servers"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Trap Ctrl+C to kill both
trap "echo -e '\n${RED}Stopping...${NC}'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT TERM

# Wait for either to exit
wait
