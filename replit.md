# Oficina do TETEU — Bot WhatsApp

## Arquitetura

- **Backend**: Node.js/Express na porta 5000 (`npm start` → `src/index.js`)
- **Banco**: PostgreSQL (via `DATABASE_URL`)
- **WhatsApp**: Meta Cloud API (configurável via painel superadmin)

## Painéis

| URL | Descrição |
|-----|-----------|
| `/` | Redireciona para `/superadmin/` (se não configurado) ou `/admin/` |
| `/superadmin/` | Configurações: empresa, credenciais WhatsApp, horários, mensagens do bot |
| `/admin/` | Painel operacional: clientes, agendamentos, mensagens |

## Estrutura de Pastas

```
src/
  admin/          — Painel operacional (HTML + rotas Express)
  superadmin/     — Painel de configuração (empresa, WhatsApp, horários, msgs)
  cache/          — Cache Redis
  config/         — Configurações (DB, WhatsApp, loader)
  database/       — Repositórios e migração SQL (001_initial.sql)
  processor/      — Máquina de estados do bot WhatsApp
  scheduler/      — Cron jobs de lembretes e retry
  utils/          — Formatadores, logger, validadores
  webhook/        — Receptor de eventos WhatsApp
  whatsapp/       — Client e templates de mensagem
  internal/       — Notificações internas
scripts/
  migrations/     — Runner de migrações
```

## Migrações

- Runner: `node scripts/migrations/run.js`
- Arquivo: `src/database/migrations/001_initial.sql`

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | PostgreSQL connection string |
| `PORT` | Não | Porta do servidor (padrão 3000) |
| `NODE_ENV` | Não | `development` ou `production` |
| `REDIS_URL` | Não | URL do Redis (cache de sessões) |
| `INTERNAL_NOTIFY_SECRET` | Não | Segredo para notificações internas |

Credenciais WhatsApp são configuradas pelo painel Superadmin e salvas no banco.

## Workflows Replit

| Workflow | Comando | Porta |
|----------|---------|-------|
| Start application | `npm start` | 5000 |

## Fluxo do Bot

1. Cliente envia mensagem → webhook `/webhook/whatsapp`
2. Processador analisa estado da sessão (`src/processor/`)
3. Resposta enviada via WhatsApp Cloud API
4. Agendamentos gerenciados via `src/scheduler/`

## GitHub

Repositório: https://github.com/farollapi-cloud/automa-owhatsapp
