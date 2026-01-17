# 🚀 Guia de Deploy para Render com Supabase

## 📋 Pré-requisitos

1. Conta no [Render.com](https://render.com) (grátis)
2. Banco de dados PostgreSQL no [Supabase](https://supabase.com) (grátis)
3. Repositório Git (GitHub, GitLab, etc.)
4. Node.js instalado localmente

---

## 🔧 Passo 1: Configurar Supabase

### 1.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Selecione sua região (preferencialmente próxima ao seu público)
4. Aguarde a criação (pode levar alguns minutos)

### 1.2 Obter Connection String
1. Vá para **Settings > Database > Connection String**
2. Selecione **URI** (não "Psycopg2")
3. Copie a string (será algo como: `postgresql://[user]:[password]@[host]:[port]/[database]`)

---

## 🚀 Passo 2: Preparar o Código

### 2.1 Atualizar `.env` Local (Desenvolvimento)
```bash
# backend/.env.local
DATABASE_URL=sqlite:./vendas.db
NODE_ENV=development
PORT=5000
JWT_SECRET=sua_chave_super_secreta
FRONTEND_URL=http://localhost:5173
```

### 2.2 Instalar Dependências Localmente
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2.3 Testar Localmente com Supabase
```bash
# Criar arquivo .env.production.local para testes
# backend/.env.production.local
DATABASE_URL=postgresql://[seu_connection_string]
NODE_ENV=production
JWT_SECRET=sua_chave_super_secreta
FRONTEND_URL=http://localhost:5173
```

---

## 📦 Passo 3: Preparar para Deploy no Render

### 3.1 Push para GitHub
```bash
git add .
git commit -m "Preparar para deploy em produção"
git push origin main
```

### 3.2 Conectar Render ao GitHub
1. Acesse [render.com](https://render.com)
2. Clique em "New +" > "Web Service"
3. Selecione "Connect a repository"
4. Autorize o Render a acessar seu GitHub
5. Selecione seu repositório

---

## 🔄 Passo 4: Deploy do Backend

### 4.1 Criar Web Service para Backend
1. **Service Name**: `vendas-backend`
2. **Environment**: `Node`
3. **Build Command**: 
   ```
   npm install
   ```
4. **Start Command**: 
   ```
   npm start
   ```
5. **Plan**: Free (recomendado para testes)

### 4.2 Configurar Variáveis de Ambiente
No Render, vá para **Environment**:
```
DATABASE_URL = postgresql://[sua_string_do_supabase]
NODE_ENV = production
JWT_SECRET = [gere uma chave secreta forte]
FRONTEND_URL = https://vendas-frontend.onrender.com
PORT = 5000
```

### 4.3 Aguardar Deploy
- O Render fará o build automaticamente
- Você verá a URL do backend (ex: `https://vendas-backend.onrender.com`)

---

## 🎨 Passo 5: Deploy do Frontend

### 5.1 Criar Static Site para Frontend
1. Clique em "New +" > "Static Site"
2. **Name**: `vendas-frontend`
3. **Build Command**: 
   ```
   npm install && npm run build
   ```
4. **Publish directory**: 
   ```
   frontend/dist
   ```

### 5.2 Configurar URL do Backend
Antes de fazer o build final, atualize:
```javascript
// frontend/src/services/api.js
// Certifique-se de que está usando a URL correta do Render
```

---

## 🔐 Passo 6: Atualizar Variáveis de Ambiente

### 6.1 Atualizar FRONTEND_URL no Backend
1. Vá ao Backend no Render
2. **Settings > Environment > FRONTEND_URL**
3. Coloque: `https://vendas-frontend.onrender.com`

### 6.2 Trigger Redeploy
Clique em **Redeploy** para aplicar as novas variáveis

---

## ✅ Passo 7: Testes Finais

### 7.1 Health Check
```bash
curl https://vendas-backend.onrender.com/api/health
```
Resposta esperada:
```json
{
  "status": "Server is running"
}
```

### 7.2 Testar Registro
1. Acesse `https://vendas-frontend.onrender.com`
2. Tente criar uma conta
3. Verifique os logs no Render

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'pg'"
```bash
# No terminal do Render (via SSH)
npm install pg
```

### Erro: "Connection refused"
1. Verifique se `DATABASE_URL` está correto
2. Verifique se Supabase está funcionando
3. Confirme que CORS está configurado corretamente

### Erro: "CORS issue"
```
// Verificar backend/src/server.js
// Certifique-se de que FRONTEND_URL está correto
```

### Banco de dados vazio
1. O Supabase cria as tabelas automaticamente
2. Se não, execute manualmente os DDL das tabelas
3. Use [Supabase Studio](https://supabase.com) para gerenciar dados

---

## 📊 Monitoramento

### Acessar Logs
- **Backend**: Render Dashboard > vendas-backend > Logs
- **Frontend**: Render Dashboard > vendas-frontend > Logs

### Métricas
- RAM, CPU, Requests no painel do Render

---

## 💰 Custos

- **Render Free Tier**: Grátis (com limitações)
- **Supabase Free Tier**: Grátis (até 500MB de dados)
- **Recomendação**: Use o plano Free inicialmente e upgrade se necessário

---

## 🚨 Checklist Final

- [ ] `.env.example` criado no backend
- [ ] Dependência `pg` adicionada ao backend
- [ ] `database.js` atualizado para suportar PostgreSQL
- [ ] CORS configurado no `server.js`
- [ ] API URL do frontend dinâmica
- [ ] Supabase connection string segura
- [ ] Variáveis de ambiente no Render configuradas
- [ ] Build local testado
- [ ] Push para GitHub feito
- [ ] Deploy no Render concluído
- [ ] Health check funcionando

---

## 📞 Próximos Passos

1. Monitorar os primeiros deploys
2. Configurar alertas no Render
3. Executar backups do Supabase regularmente
4. Implementar CI/CD automático

Boa sorte! 🎉
