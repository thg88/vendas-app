# ✅ Checklist de Migração para Produção

## 🔧 Configuração Local

### Backend
- [ ] Instalar dependências: `npm install` (incluindo `pg`)
- [ ] Criar `.env.local` com `DATABASE_URL` do SQLite
- [ ] Testar localmente: `npm run dev`
- [ ] Verificar que o servidor sobe na porta 5000
- [ ] Testar endpoints com Postman ou curl

### Frontend
- [ ] Instalar dependências: `npm install`
- [ ] Testar localmente: `npm run dev`
- [ ] Verificar que API está conectando ao backend local
- [ ] Build de produção: `npm run build`
- [ ] Verificar pasta `dist/` foi criada

---

## 🗄️ Preparação do Banco de Dados

### Supabase
- [ ] Criar conta em [supabase.com](https://supabase.com)
- [ ] Criar novo projeto PostgreSQL
- [ ] Obter Connection String (URI format)
- [ ] Guardar em local seguro (não committar no git!)
- [ ] Testar conexão localmente

### Migração de Dados (Opcional)
- [ ] Exportar dados do SQLite se necessário
- [ ] Importar dados no Supabase
- [ ] Validar integridade dos dados

---

## 🔐 Segurança

- [ ] Gerar `JWT_SECRET` forte (mínimo 32 caracteres aleatórios)
- [ ] Não committar arquivos `.env` no Git
- [ ] Verificar `.gitignore` contém `*.env`
- [ ] Revisar dados sensíveis antes de push

---

## 📤 Preparação para Git

### Verificar Arquivos
- [ ] `.env.example` existe no backend com placeholders
- [ ] `.env.local` não será commitado
- [ ] `package.json` tem `pg` como dependency
- [ ] `.gitignore` está atualizado

### Push para GitHub
```bash
git add .
git commit -m "Preparar para produção com Supabase e Render"
git push origin main
```

---

## 🚀 Deploy no Render

### Passo 1: Backend
- [ ] Criar Web Service no Render
- [ ] Conectar repositório GitHub
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Configurar Environment Variables:
  - [ ] `DATABASE_URL` (do Supabase)
  - [ ] `NODE_ENV` = `production`
  - [ ] `JWT_SECRET` (gerado)
  - [ ] `FRONTEND_URL` (será `https://seu-app-frontend.onrender.com`)
  - [ ] `PORT` = `5000`
- [ ] Iniciar deploy
- [ ] Aguardar conclusão (5-10 minutos)
- [ ] Anotar URL do backend (ex: https://vendas-backend.onrender.com)

### Passo 2: Frontend
- [ ] Criar Static Site no Render
- [ ] Conectar repositório GitHub
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `frontend/dist`
- [ ] Iniciar deploy
- [ ] Aguardar conclusão
- [ ] Anotar URL do frontend (ex: https://vendas-frontend.onrender.com)

---

## 🔗 Atualizar Conexões

- [ ] Ir ao Backend > Settings > Environment
- [ ] Atualizar `FRONTEND_URL` com URL do frontend
- [ ] Clique em "Redeploy" para aplicar

---

## ✅ Testes Finais

### Health Check
```bash
curl https://seu-backend.onrender.com/api/health
# Esperado: {"status":"Server is running"}
```

### Testes Funcionais
- [ ] Acessar `https://seu-frontend.onrender.com`
- [ ] Criar uma conta nova
- [ ] Login com a conta criada
- [ ] Verificar se dados estão sendo salvos
- [ ] Testar principais funcionalidades

### Verificar Logs
- [ ] Backend: Verificar logs no Render
- [ ] Frontend: Verificar console do navegador (F12)

---

## 🐛 Troubleshooting

Se algo não funcionar:

### Backend não inicia
```
1. Verificar logs no Render
2. Checar DATABASE_URL está correto
3. Verificar JWT_SECRET não está vazio
4. Tentar npm install manualmente
```

### Erro de conexão com banco
```
1. Copiar CONNECTION STRING do Supabase (formato URI)
2. Colar em DATABASE_URL no Render
3. Redeploy
```

### Frontend não conecta ao backend
```
1. Verificar FRONTEND_URL no backend está correto
2. Verificar api.js no frontend usa getAPIUrl() corretamente
3. Checar CORS error no console
4. Redeploy ambos os serviços
```

---

## 📊 Monitoramento

- [ ] Ativar logs de debug
- [ ] Monitorar uso de CPU/RAM
- [ ] Verificar plano free não foi excedido
- [ ] Configurar alertas de erro

---

## 🎉 Deploy Completo!

Parabéns! Seu aplicativo está online:
- **Backend**: https://seu-backend.onrender.com
- **Frontend**: https://seu-frontend.onrender.com
- **Database**: Supabase PostgreSQL

---

## 📝 Notas Importantes

1. **Downtime**: Serviços free no Render dormem após inatividade (15 min). Para evitar, upgrade para pago.
2. **Backups**: Configure backups automáticos no Supabase
3. **Secrets**: Mude `JWT_SECRET` periodicamente
4. **Updates**: Mantenha dependências atualizadas com `npm audit`

Boa sorte! 🚀
