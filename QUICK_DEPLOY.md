# ⚡ Guia Rápido - Deploy Render + Supabase

## 3 Passos Principais

### 1️⃣ **Supabase Setup** (5 minutos)
```
1. Vá para https://supabase.com
2. Crie novo projeto PostgreSQL
3. Copie a Connection String (Settings > Database > Connection String)
4. Guarde em local seguro (será DATABASE_URL)
```

### 2️⃣ **Push para GitHub** (2 minutos)
```bash
git add .
git commit -m "Pronto para produção"
git push origin main
```

### 3️⃣ **Deploy no Render** (15 minutos)

#### Backend
1. Acesse https://render.com
2. Clique "New" > "Web Service"
3. Conecte seu GitHub
4. Configure:
   - **Name**: vendas-backend
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**:
     ```
     DATABASE_URL = [sua_connection_string_supabase]
     NODE_ENV = production
     JWT_SECRET = [gere uma chave aleatória forte]
     FRONTEND_URL = https://seu-app-frontend.onrender.com
     ```

#### Frontend
1. Clique "New" > "Static Site"
2. Configure:
   - **Name**: vendas-frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

---

## 📋 Checklist Rápido

| Item | Status |
|------|--------|
| [ ] `.env.example` criado | ⏳ |
| [ ] `pg` adicionado ao backend | ⏳ |
| [ ] CORS configurado | ⏳ |
| [ ] Código feito push | ⏳ |
| [ ] Backend deployado | ⏳ |
| [ ] Frontend deployado | ⏳ |
| [ ] URLs atualizadas | ⏳ |
| [ ] Health check OK | ⏳ |

---

## 🧪 Teste Rápido

```bash
# Health check do backend
curl https://seu-backend.onrender.com/api/health

# Deve retornar:
# {"status":"Server is running"}
```

---

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Cannot find module 'pg'" | Rode `npm install pg` |
| CORS Error | Verifique `FRONTEND_URL` no backend |
| Banco vazio | Use Supabase Studio para criar tabelas |
| 500 Error | Verifique logs: Render Dashboard > Logs |

---

## 📚 Documentação Completa

Veja `DEPLOY_RENDER_SUPABASE.md` para guia detalhado.
Veja `CHECKLIST_PRODUCAO.md` para checklist completo.

---

## 🔑 Variáveis Importantes

```env
# Backend
DATABASE_URL=postgresql://user:password@host:port/db
NODE_ENV=production
PORT=5000
JWT_SECRET=chave_super_secreta
FRONTEND_URL=https://seu-frontend.onrender.com

# Frontend (automático)
VITE_API_URL=https://seu-backend.onrender.com/api
```

---

## 💬 Dúvidas?

1. Verificar logs no Render Dashboard
2. Ler `DEPLOY_RENDER_SUPABASE.md`
3. Testar localmente com `.env.local`

Boa sorte! 🚀
