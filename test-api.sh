#!/bin/bash
# Script para testar API localmente ou em produção

# Configuração
BACKEND_URL="${1:-http://localhost:5000}"
API_URL="${BACKEND_URL}/api"

echo "🧪 Testando API em: $API_URL"
echo "═════════════════════════════════════════"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}→ $description${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo ""
}

# Testes
echo -e "${GREEN}1. HEALTH CHECK${NC}"
test_endpoint "GET" "/health" "" "Verificar se servidor está online"

echo -e "${GREEN}2. AUTENTICAÇÃO${NC}"
test_endpoint "POST" "/auth/register" \
    '{"username":"testuser","email":"test@example.com","password":"123456"}' \
    "Registrar novo usuário"

echo -e "${GREEN}3. LOGIN${NC}"
test_endpoint "POST" "/auth/login" \
    '{"username":"testuser","password":"123456"}' \
    "Login com usuário"

echo -e "${GREEN}4. CLIENTES${NC}"
test_endpoint "GET" "/clients" "" "Listar todos os clientes"

test_endpoint "POST" "/clients" \
    '{"nome":"João Silva","email":"joao@example.com","telefone":"11999999999"}' \
    "Criar novo cliente"

echo -e "${GREEN}5. PRODUTOS${NC}"
test_endpoint "GET" "/products" "" "Listar todos os produtos"

test_endpoint "POST" "/products" \
    '{"nome":"Produto Teste","descricao":"Teste","preco":99.99,"estoque":10}' \
    "Criar novo produto"

echo -e "${GREEN}6. LOTES${NC}"
test_endpoint "GET" "/lotes" "" "Listar todos os lotes"

test_endpoint "POST" "/lotes" \
    '{"numero_lote":"L001","tipo":"venda","observacoes":"Teste"}' \
    "Criar novo lote"

echo -e "${GREEN}7. WISHLIST${NC}"
test_endpoint "GET" "/wishlist" "" "Listar wishlist"

test_endpoint "POST" "/wishlist" \
    '{"nome":"João","item":"Produto X","data_pedido":"2024-01-17"}' \
    "Adicionar item à wishlist"

echo ""
echo -e "${GREEN}═════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Testes concluídos!${NC}"
echo ""

# Dicas
echo -e "${YELLOW}💡 Dicas:${NC}"
echo "  • Para testar em produção:"
echo "    ./test-api.sh https://seu-backend.onrender.com"
echo ""
echo "  • Para salvar resultados:"
echo "    ./test-api.sh > resultados.txt"
echo ""
echo "  • Instale jq para melhor formatting:"
echo "    Windows: choco install jq"
echo "    macOS: brew install jq"
echo "    Linux: apt-get install jq"
