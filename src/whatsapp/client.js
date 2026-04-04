'use strict';

const config = require('../config');
const { getDbConfig } = require('../config/loader');

async function getProvider() {
  return (await getDbConfig('whatsapp_provider', 'meta')) || 'meta';
}

async function sendTextMeta(to, text) {
  const token = await getDbConfig('whatsapp_token', config.whatsapp.token);
  const phoneNumberId = await getDbConfig('whatsapp_phone_number_id', config.whatsapp.phoneNumberId);
  if (!token) {
    console.warn('[whatsapp/meta] token ausente — mensagem não enviada (dev)');
    return { ok: false, skipped: true };
  }
  if (!phoneNumberId) {
    console.warn('[whatsapp/meta] phone_number_id ausente — mensagem não enviada (dev)');
    return { ok: false, skipped: true };
  }
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[whatsapp/meta] erro envio', res.status, json);
    return { ok: false, error: json };
  }
  return { ok: true, data: json };
}

async function sendTextUazapi(to, text) {
  const baseUrl = (await getDbConfig('uazapi_base_url', '')).replace(/\/$/, '');
  const instance = await getDbConfig('uazapi_instance', '');
  const token = await getDbConfig('uazapi_token', '');

  if (!baseUrl || !instance || !token) {
    console.warn('[whatsapp/uazapi] configuração incompleta (base_url, instance ou token ausente) — mensagem não enviada');
    return { ok: false, skipped: true };
  }

  const phone = String(to).replace(/\D/g, '');
  const url = `${baseUrl}/${instance}/sendText`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { Token: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, body: text }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[whatsapp/uazapi] erro envio', res.status, json);
    return { ok: false, error: json };
  }
  return { ok: true, data: json };
}

async function sendText(to, text) {
  const provider = await getProvider();
  if (provider === 'uazapi') return sendTextUazapi(to, text);
  return sendTextMeta(to, text);
}

module.exports = { sendText };
