#!/bin/bash
# Script para facilitar setup e testes de produção localmente

echo "🚀 Iniciando setup para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js não encontrado. Por favor, instale Node.js${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"
}

check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm não encontrado${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ npm encontrado: $(npm -v)${NC}"
}

install_backend() {
    echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
    cd backend
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend pronto${NC}"
    else
        echo -e "${RED}❌ Erro ao instalar backend${NC}"
        exit 1
    fi
    cd ..
}

install_frontend() {
    echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
    cd frontend
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend pronto${NC}"
    else
        echo -e "${RED}❌ Erro ao instalar frontend${NC}"
        exit 1
    fi
    cd ..
}

setup_env_local() {
    echo -e "${YELLOW}⚙️  Configurando ambiente local...${NC}"
    
    if [ ! -f "backend/.env.local" ]; then
        echo -e "${YELLOW}Criando backend/.env.local${NC}"
        cat > backend/.env.local << EOF
DATABASE_URL=sqlite:./vendas.db
NODE_ENV=development
PORT=5000
JWT_SECRET=sua_chave_super_secreta_desenvolvimento
FRONTEND_URL=http://localhost:5173
EOF
        echo -e "${GREEN}✓ backend/.env.local criado${NC}"
    else
        echo -e "${GREEN}✓ backend/.env.local já existe${NC}"
    fi
}

test_backend() {
    echo -e "${YELLOW}🧪 Testando backend...${NC}"
    cd backend
    npm start &
    BACKEND_PID=$!
    sleep 3
    
    # Teste health check
    if curl -s http://localhost:5000/api/health | grep -q "Server is running"; then
        echo -e "${GREEN}✓ Backend respondendo corretamente${NC}"
    else
        echo -e "${RED}❌ Backend não está respondendo${NC}"
    fi
    
    kill $BACKEND_PID
    cd ..
}

test_frontend_build() {
    echo -e "${YELLOW}🧪 Testando build do frontend...${NC}"
    cd frontend
    npm run build
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓ Build do frontend OK${NC}"
    else
        echo -e "${RED}❌ Build do frontend falhou${NC}"
        exit 1
    fi
    cd ..
}

# Executar checklist
echo -e "${YELLOW}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}   Checklist de Produção${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}\n"

check_node
check_npm

echo ""
echo -e "${YELLOW}Instalando dependências...${NC}"
install_backend
install_frontend

echo ""
setup_env_local

echo ""
read -p "Deseja testar o backend? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    test_backend
fi

echo ""
read -p "Deseja fazer build do frontend? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    test_frontend_build
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✓ Setup concluído com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Configure DATABASE_URL no Supabase"
echo "2. Configure variáveis de ambiente no Render"
echo "3. Faça push do código para GitHub"
echo "4. Deploy no Render"
echo ""
echo "Para mais detalhes, veja: DEPLOY_RENDER_SUPABASE.md"
