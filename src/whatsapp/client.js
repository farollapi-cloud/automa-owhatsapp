'use strict';

const config = require('../config');
const { getDbConfig } = require('../config/loader');

async function getCredentials() {
  const token = await getDbConfig('whatsapp_token', config.whatsapp.token);
  const phoneNumberId = await getDbConfig('whatsapp_phone_number_id', config.whatsapp.phoneNumberId);
  return { token, phoneNumberId };
}

async function sendText(to, text) {
  const { token, phoneNumberId } = await getCredentials();
  if (!token) {
    console.warn('[whatsapp] token ausente — mensagem não enviada (dev)');
    return { ok: false, skipped: true };
  }
  if (!phoneNumberId) {
    console.warn('[whatsapp] phone_number_id ausente — mensagem não enviada (dev)');
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
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[whatsapp] erro envio', res.status, json);
    return { ok: false, error: json };
  }
  return { ok: true, data: json };
}

module.exports = { sendText };
