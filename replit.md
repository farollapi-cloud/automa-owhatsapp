# Oficina do TETEU — Bot WhatsApp

## Arquitetura

- **Backend**: Node.js/Express na porta 5000 (`npm start` → `src/index.js`)
- **Banco**: PostgreSQL (via `DATABASE_URL`)
- **WhatsApp**: UazAPI (padrão) ou Meta Cloud API — configurável via painel superadmin

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
  webhook/        — Receptor de eventos WhatsApp (Meta e UazAPI)
  whatsapp/       — Client (suporta Meta API e UazAPI)
  internal/       — Notificações internas
scripts/
  migrations/     — Runner de migrações
```

## Migrações

- Runner: `node scripts/migrations/run.js`
- Arquivo: `src/database/migrations/001_initial.sql`

## Integração WhatsApp

### UazAPI (padrão/recomendado)

Configurar no painel superadmin:
- **URL base**: e.g. `https://focus.uazapi.com`
- **Instância**: nome da instância criada no UazAPI
- **Token**: token da instância

Webhook para configurar no painel UazAPI: `https://<domínio>/webhook/uazapi`

### Meta Cloud API

Configurar no painel superadmin (campos alternativos):
- Phone Number ID, Access Token, Verify Token, App Secret

Webhook: `https://<domínio>/webhook/whatsapp`

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | PostgreSQL connection string |
| `PORT` | Não | Porta do servidor (configurado para 5000 via Replit; padrão do código: 3000) |
| `NODE_ENV` | Não | `development` ou `production` |
| `REDIS_URL` | Não | URL do Redis (cache de sessões) |
| `INTERNAL_NOTIFY_SECRET` | Não | Segredo para notificações internas |

Credenciais WhatsApp são configuradas pelo painel Superadmin e salvas no banco.

## Chaves de configuração no banco (`configuracoes`)

| Chave | Descrição |
|-------|-----------|
| `whatsapp_provider` | `uazapi` ou `meta` |
| `uazapi_base_url` | URL base do servidor UazAPI |
| `uazapi_instance` | Nome da instância UazAPI |
| `uazapi_token` | Token da instância UazAPI (secret) |
| `whatsapp_token` | Access Token da Meta API (secret) |
| `whatsapp_phone_number_id` | Phone Number ID da Meta API |
| `whatsapp_verify_token` | Verify Token do webhook Meta |
| `whatsapp_app_secret` | App Secret da Meta API (secret) |
| `empresa_nome` | Nome da empresa exibido no bot |
| `empresa_telefone` | Telefone de contato |
| `horarios` | JSON com horários de atendimento |
| `msg_boas_vindas` | Mensagem de boas-vindas |
| `msg_menu_sem_agendamento` | Menu principal sem agendamento |
| `msg_menu_com_agendamento` | Menu com agendamento ativo |

## Workflows Replit

| Workflow | Comando | Porta |
|----------|---------|-------|
| Start application | `npm start` | 5000 |

## Fluxo do Bot

1. Cliente envia mensagem → webhook `/webhook/uazapi` (UazAPI) ou `/webhook/whatsapp` (Meta)
2. Processador analisa estado da sessão (`src/processor/`)
3. Resposta enviada via UazAPI ou Meta API (detectado automaticamente pelo provider configurado)
4. Agendamentos gerenciados via `src/scheduler/`
