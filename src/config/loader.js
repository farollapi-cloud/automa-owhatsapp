'use strict';

const { query } = require('../database/connection');

let _cache = {};
let _cacheTime = 0;
const TTL = 60 * 1000;

async function loadAll() {
  const now = Date.now();
  if (now - _cacheTime < TTL) return _cache;
  try {
    const r = await query('SELECT chave, valor FROM configuracoes');
    _cache = {};
    for (const row of r.rows) {
      _cache[row.chave] = row.valor;
    }
    _cacheTime = now;
  } catch {
  }
  return _cache;
}

async function getDbConfig(chave, fallback) {
  const all = await loadAll();
  const val = all[chave];
  if (val !== undefined && val !== null && val !== '') return val;
  return fallback !== undefined ? fallback : null;
}

function invalidateCache() {
  _cacheTime = 0;
  _cache = {};
}

module.exports = { getDbConfig, invalidateCache, loadAll };
