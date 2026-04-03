# Oficina do TETEU - WhatsApp Bot

A Node.js WhatsApp automation system for an automotive workshop. Provides a conversational interface for customers to schedule services, check appointments, cancel them, and receive reminders via the WhatsApp Cloud API. Includes an administrative dashboard.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Framework**: Express.js
- **Database**: PostgreSQL (Replit built-in)
- **Cache**: Redis via ioredis (optional - app works without it)
- **Scheduler**: node-cron
- **Integration**: WhatsApp Cloud API (Meta Graph API v21.0)

## Project Structure

- `src/index.js` — App entry point, Express server setup
- `src/config/` — Centralized configuration from env vars
- `src/webhook/` — WhatsApp webhook receiver
- `src/processor/` — State machine for conversation flows
- `src/scheduler/` — Cron jobs for reminders and retries
- `src/database/` — PostgreSQL connection, repos, migrations
- `src/cache/` — Redis client helpers
- `src/admin/` — Admin dashboard routes and static files
- `src/whatsapp/` — WhatsApp API client and message templates
- `src/utils/` — Logging, formatting, validation helpers
- `scripts/migrations/` — Migration runner scripts

## Environment Variables

Required:
- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `WHATSAPP_TOKEN` — WhatsApp Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID` — WhatsApp phone number ID
- `WHATSAPP_VERIFY_TOKEN` — Webhook verification token
- `WHATSAPP_APP_SECRET` — Meta app secret

Optional:
- `REDIS_URL` — Redis connection string (app works without it)
- `INTERNAL_NOTIFY_SECRET` — Secret for internal notifications
- `PORT` — Server port (default 5000)
- `NODE_ENV` — Environment (development/production)

## Running the App

- `npm start` — Start the server
- `npm run migrate` — Run database migrations

## Setup Notes

- App runs on port 5000 (0.0.0.0)
- Database migrations applied via the built-in PostgreSQL database
- Deployment configured as VM (always-running) for webhook support and cron jobs
- Redis is optional; the app gracefully degrades without it
