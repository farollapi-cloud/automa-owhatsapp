'use strict';

const express = require('express');
const repos = require('../database/reposEmpresa');
const config = require('../config');
const { requireAdmin } = require('../admin/middleware/adminAuth');

const router = express.Router();

/** Indica se já existe linha em `empresas` (deploy já "registrado"; modelo single-tenant). */
router.get('/status', async (req, res) => {
  try {
    const has_empresa = await repos.hasAnyEmpresa();
    res.json({ has_empresa });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function webhookUrl(token) {
  const base = (config.webhookBaseUrl || '').replace(/\/$/, '');
  return `${base}/webhook/entrada/${token}`;
}

/**
 * POST /empresa — criação de empresa.
 * Single-tenant: só permite criar se não houver nenhuma empresa cadastrada (bootstrap).
 * Após o bootstrap, exige autenticação de admin.
 */
router.post('/', async (req, res) => {
  try {
    const has_empresa = await repos.hasAnyEmpresa();

    if (has_empresa) {
      return requireAdmin(req, res, async () => {
        try {
          const { nome, email, cnpj } = req.body || {};
          if (!nome || !String(nome).trim()) {
            return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
          }
          const empresa = await repos.insertEmpresa({ nome, email, cnpj });
          res.status(201).json({
            id: empresa.id,
            nome: empresa.nome,
            email: empresa.email,
            cnpj: empresa.cnpj,
            status: empresa.status,
            webhook_url: webhookUrl(empresa.webhook_token),
            created_at: empresa.created_at,
          });
        } catch (e) {
          res.status(500).json({ error: e.message });
        }
      });
    }

    const { nome, email, cnpj } = req.body || {};
    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    const empresa = await repos.insertEmpresa({ nome, email, cnpj });
    res.status(201).json({
      id: empresa.id,
      nome: empresa.nome,
      email: empresa.email,
      cnpj: empresa.cnpj,
      status: empresa.status,
      webhook_url: webhookUrl(empresa.webhook_token),
      created_at: empresa.created_at,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
