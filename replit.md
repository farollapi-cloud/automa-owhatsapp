# Oficina do TETEU — Bot WhatsApp

## Arquitetura

- **Backend**: Node.js/Express na porta 5000 (`npm start` → `src/index.js`)
- **Frontend**: Next.js 14 na porta 3001 (`npm run dev --prefix web`)
- **Banco**: PostgreSQL (via `DATABASE_URL`)
- **WhatsApp**: UazAPI (padrão) ou Meta Cloud API

## Estrutura de Pastas

```
src/
  admin/          — Painel admin (HTML + rotas Express)
  config/         — Configurações (DB, WhatsApp runtime)
  database/       — Repositórios e migrações SQL
  processor/      — Máquina de estados do bot
  routes/         — Rotas REST (agendamento, empresa)
  scheduler/      — Cron jobs de lembretes
  utils/          — Utilitários (crypto, etc.)
  webhook/        — Receptor de eventos WhatsApp
  internal/       — Notificações internas
web/              — Frontend Next.js
scripts/
  migrations/     — Runner de migrações (idempotente via tabela _migrations)
```

## Migrações

- Runner: `node scripts/migrations/run.js`
- Arquivos em `src/database/migrations/` (ordenados por nome)
- Tabela `_migrations` controla quais já foram aplicadas (idempotente)
- Para re-aplicar: apagar registro da tabela `_migrations`

## Workflows Replit

| Workflow        | Comando                       | Porta |
|-----------------|-------------------------------|-------|
| Start application | `npm start`                 | 5000  |
| Frontend Web    | `npm run dev --prefix web`   | 3001  |

## Variáveis de Ambiente

| Variável                  | Obrigatória | Descrição                              |
|---------------------------|-------------|----------------------------------------|
| `DATABASE_URL`            | Sim         | PostgreSQL connection string           |
| `CORS_ORIGIN`             | Não         | Origens permitidas (separadas por `,`) |
| `WEBHOOK_BASE_URL`        | Não         | URL pública para webhook               |
| `ADMIN_PASSWORD`          | Não         | Senha do painel admin                  |
| `ADMIN_SESSION_SECRET`    | Não         | Segredo para cookie de sessão          |
| `SETTINGS_ENCRYPTION_KEY` | Não         | 32-byte hex para criptografia tokens   |
| `WHATSAPP_PROVIDER`       | Não         | `auto` (padrão), `uazapi` ou `meta`   |

Frontend (`web/.env.local`):
- `NEXT_PUBLIC_API_URL` — URL do backend (ex: `https://xxx.replit.dev`)
- `NEXT_PUBLIC_SUPPORT_WHATSAPP` — Link do suporte no WhatsApp

## Sincronização com GitHub

Repositório: https://github.com/farollapi-cloud/automa-owhatsapp

### Puxar atualizações do GitHub para o Replit

```bash
git fetch origin
# Aplicar arquivos do origin/main exceto .replit e replit.nix:
git checkout origin/main -- .
git checkout HEAD -- .replit replit.nix
git add -A && git commit -m "sync: origin/main"
```

### Enviar alterações do Replit para o GitHub

```bash
git push origin main
```

> Atenção: o Replit protege `.replit` e `replit.nix` — nunca sobrescreva esses arquivos com os do GitHub.

## Rotas Principais

| Rota              | Descrição                              |
|-------------------|----------------------------------------|
| `GET /`           | Redireciona para `/admin/`             |
| `GET /admin/`     | Painel de configuração                 |
| `POST /webhook/*` | Entradas do WhatsApp                   |
| `GET /health`     | Health check                           |
| `GET /agendamento/*` | API de agendamentos               |
| `GET /empresa/*`  | API de dados da empresa                |
| `POST /internal/notify` | Notificações internas           |
