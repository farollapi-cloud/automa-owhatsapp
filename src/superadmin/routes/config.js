'use strict';

const express = require('express');
const path = require('path');
const repos = require('../../database/repos');
const { invalidateCache, getDbConfig } = require('../../config/loader');

const router = express.Router();

const SENSITIVE_KEYS = ['whatsapp_token', 'whatsapp_app_secret', 'uazapi_token'];

function maskValue(chave, valor) {
  if (!valor) return '';
  if (SENSITIVE_KEYS.includes(chave)) {
    if (valor.length <= 8) return '****';
    return '****' + valor.slice(-4);
  }
  return valor;
}

router.get('/api/config', async (req, res) => {
  try {
    const rows = await repos.getAllConfigs();
    const result = {};
    for (const row of rows) {
      result[row.chave] = {
        valor: maskValue(row.chave, row.valor),
        tipo: row.tipo,
        descricao: row.descricao,
      };
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/api/config', express.json(), async (req, res) => {
  try {
    const { configs } = req.body || {};
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ error: 'Campo "configs" obrigatório' });
    }

    const FIELDS = [
      { chave: 'empresa_nome', tipo: 'string', descricao: 'Nome da empresa exibido no bot' },
      { chave: 'empresa_telefone', tipo: 'string', descricao: 'Telefone de contato da empresa' },
      { chave: 'whatsapp_provider', tipo: 'string', descricao: 'Provedor WhatsApp: meta ou uazapi' },
      { chave: 'uazapi_base_url', tipo: 'string', descricao: 'URL base do servidor UazAPI' },
      { chave: 'uazapi_instance', tipo: 'string', descricao: 'Nome da instância UazAPI' },
      { chave: 'uazapi_token', tipo: 'secret', descricao: 'Token da instância UazAPI' },
      { chave: 'whatsapp_token', tipo: 'secret', descricao: 'Token de acesso WhatsApp Cloud API (Meta)' },
      { chave: 'whatsapp_phone_number_id', tipo: 'string', descricao: 'ID do número de telefone WhatsApp (Meta)' },
      { chave: 'whatsapp_verify_token', tipo: 'string', descricao: 'Token de verificação do webhook (Meta)' },
      { chave: 'whatsapp_app_secret', tipo: 'secret', descricao: 'App Secret para validação de assinatura (Meta)' },
      { chave: 'horarios', tipo: 'json', descricao: 'Horários de atendimento disponíveis (JSON)' },
      { chave: 'msg_boas_vindas', tipo: 'string', descricao: 'Mensagem de boas-vindas ao primeiro contato' },
      { chave: 'msg_menu_sem_agendamento', tipo: 'string', descricao: 'Texto do menu principal (sem agendamento ativo)' },
      { chave: 'msg_menu_com_agendamento', tipo: 'string', descricao: 'Texto do menu (com agendamento ativo)' },
    ];

    for (const field of FIELDS) {
      const raw = configs[field.chave];
      if (raw === undefined || raw === null) continue;
      const valor = String(raw).trim();
      if (SENSITIVE_KEYS.includes(field.chave) && (valor === '' || valor.startsWith('****'))) continue;
      await repos.setConfig(field.chave, valor || null, field.tipo, field.descricao);
    }

    invalidateCache();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/api/webhook-url', async (req, res) => {
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost';
  const provider = (await getDbConfig('whatsapp_provider', 'meta')) || 'meta';
  const path_ = provider === 'uazapi' ? '/webhook/uazapi' : '/webhook/whatsapp';
  res.json({ url: `${proto}://${host}${path_}`, provider });
});

router.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = router;
