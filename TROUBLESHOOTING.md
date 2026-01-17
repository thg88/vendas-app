# 🔧 Guia de Troubleshooting

## Problemas Comuns e Soluções

---

## ❌ Backend não inicia

### Erro: "EADDRINUSE: address already in use :::5000"

**Problema:** Outra aplicação está usando a porta 5000

**Solução 1 - Alterar porta:**
1. Abra `backend/.env`
2. Altere `PORT=5000` para `PORT=5001` (ou outra porta livre)
3. Reinicie o backend

**Solução 2 - Liberar porta (Windows):**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## ❌ Frontend não conecta ao backend

### Erro: "CORS error" ou "Network error"

**Problema:** Backend não está rodando ou está em porta diferente

**Solução 1 - Verificar se backend está rodando:**
1. Verifique se você rodou `npm run dev` na pasta backend
2. Verifique se a mensagem apareceu:
   ```
   Servidor rodando na porta 5000
   Conectado ao banco de dados SQLite
   ```

**Solução 2 - Verificar porta do backend:**
1. Abra `frontend/src/services/api.js`
2. Verifique se `const API_URL = 'http://localhost:5000/api'` está correto
3. Se mudou a porta do backend, altere aqui também

---

## ❌ Login não funciona

### Erro: "Erro ao fazer login" ou "Usuário não encontrado"

**Problema:** Primeira vez usando a app - precisa registrar um usuário

**Solução 1 - Registrar primeiro usuário:**

Abra um terminal e faça uma requisição para criar um usuário:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"vendedor1","email":"vendedor@example.com","password":"123456"}'
```

Depois pode fazer login com essas credenciais.

**Solução 2 - Se o erro persistir:**
1. Verifique se o backend está rodando
2. Verifique se o banco de dados foi criado (`backend/vendas.db`)
3. Se o BD estiver corrompido, delete o arquivo `vendas.db` e reinicie

---

## ❌ Banco de dados corrompido

### Erro: "database disk image is malformed" ou erros no BD

**Problema:** Arquivo do banco de dados foi corrompido

**Solução:**
1. Feche a aplicação completamente
2. Delete o arquivo: `backend/vendas.db`
3. Reinicie o backend com `npm run dev`
4. Novo banco será criado automaticamente

---

## ❌ Venda não registra

### Erro: "Erro ao registrar venda" ou campo em branco

**Checklist:**
- [ ] Você selecionou um cliente?
- [ ] Você adicionou pelo menos um produto?
- [ ] Você inseriu a quantidade correta?
- [ ] O backend está respondendo?

**Solução:**
1. Recarregue a página (F5)
2. Tente novamente
3. Se persistir, verifique os logs do backend

---

## ❌ Produtos/Clientes não aparecem na lista

### Problema: Lista vazia mesmo depois de criar

**Solução:**
1. Recarregue a página (F5)
2. Verifique se criou com sucesso (veja a mensagem verde)
3. Se problema persistir, verifique conexão com backend
4. Abra DevTools (F12) > Network para ver as requisições

---

## ❌ Botão "Logout" não funciona

### Problema: Não sai do login

**Solução:**
1. Limpe o localStorage:
   ```javascript
   // Abra Console (F12) e execute:
   localStorage.clear()
   location.reload()
   ```

---

## ❌ Porta 3000 já em uso

### Erro: "Port 3000 is already in use"

**Solução 1 - Alterar porta:**
1. Abra `frontend/vite.config.js`
2. Procure: `port: 3000`
3. Altere para `port: 3001` (ou outra porta livre)
4. Reinicie frontend

**Solução 2 - Liberar porta:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## ❌ Erro de npm install

### Erro: "npm ERR!" ao instalar dependências

**Solução:**
1. Delete a pasta `node_modules`:
   ```bash
   rm -r node_modules
   rm package-lock.json
   ```
2. Reinstale:
   ```bash
   npm install
   ```
3. Se erro persistir, verifique sua conexão de internet

---

## ❌ Frontend não carrega CSS

### Problema: Página sem estilos (apenas HTML branco)

**Solução:**
1. Abra DevTools (F12)
2. Vá para Network tab
3. Verifique se os arquivos CSS estão sendo carregados
4. Se retornam erro, tente limpar cache:
   ```
   CTRL + SHIFT + Delete (ou CTRL + SHIFT + R)
   ```

---

## ❌ "Cannot GET /"

### Problema: Página branca ao acessar localhost:3000

**Solução:**
1. Verifique se o frontend realmente iniciou
2. Procure mensagens de erro no terminal do frontend
3. Se não iniciou, tente:
   ```bash
   npm run build
   npm run preview
   ```

---

## ✅ Como Verificar se Tudo Está OK

### Checklist de Funcionamento:

1. **Backend:**
   - [ ] Terminal mostra "Servidor rodando na porta 5000"
   - [ ] Terminal mostra "Conectado ao banco de dados SQLite"
   - [ ] Nenhum erro em vermelho

2. **Frontend:**
   - [ ] Página abre em http://localhost:3000
   - [ ] Vê formulário de login
   - [ ] Pode digitar username e password

3. **Banco de Dados:**
   - [ ] Arquivo `backend/vendas.db` foi criado
   - [ ] Tem tamanho > 0 bytes

4. **Autenticação:**
   - [ ] Consegue fazer login
   - [ ] Vê o dashboard com menu
   - [ ] Consegue fazer logout

5. **Vendas:**
   - [ ] Consegue lançar uma venda
   - [ ] Consegue criar cliente
   - [ ] Consegue criar produto
   - [ ] Consegue consultar venda registrada

---

## 📞 Logs e Debugging

### Ver logs do Backend:
- Todos os logs aparecem no terminal onde você rodou `npm run dev`
- Procure por mensagens em vermelho (erros)

### Ver logs do Frontend:
1. Abra DevTools (F12)
2. Vá para aba "Console"
3. Procure por mensagens em vermelho

### Inspecionar requisições HTTP:
1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Faça uma ação (ex: login)
4. Veja se a requisição foi enviada
5. Verifique se recebeu resposta (200, 201, 400, etc)

---

## 🔄 Reiniciar Tudo do Zero

Se nada funcionar, refaça o setup:

### Passo 1 - Limpe tudo:
```bash
# Backend
cd backend
rm -r node_modules
rm package-lock.json

# Frontend
cd ../frontend
rm -r node_modules
rm package-lock.json

# Banco de dados
cd ../backend
rm vendas.db
```

### Passo 2 - Reinstale:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Passo 3 - Inicie novamente:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🆘 Ainda Não Resolveu?

### Informações para Debug:

Colete essas informações:
1. **Sistema Operacional:** Windows 10/11?
2. **Versão Node:** `node --version`
3. **Versão npm:** `npm --version`
4. **Mensagem de erro exata** (copie e cole)
5. **O que você estava fazendo** quando ocorreu o erro

### Verifique:
- [ ] Está na pasta correta?
- [ ] Rodou `npm install`?
- [ ] Ambos os terminais estão rodando?
- [ ] Está acessando `localhost:3000` (não `localhost:3001`)?
- [ ] Tem porta 3000 e 5000 livres?

---

## 📝 Notas Importantes

**Importante:** Cada vez que modifica um arquivo `.js` ou `.jsx`:
- **Backend:** Reinicia automaticamente (com `npm run dev`)
- **Frontend:** Recarrega automaticamente (hot reload)

Se não recarregar:
- Backend: Pare (CTRL+C) e inicie novamente
- Frontend: Recarregue a página (F5)

---

## ✅ Se Tudo Estiver Funcionando

Parabéns! 🎉

Você pode:
- Fazer login
- Registrar vendas
- Criar clientes e produtos
- Consultar vendas

**Use a aplicação com confiança!**
