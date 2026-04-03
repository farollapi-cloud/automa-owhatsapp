'use strict';

const { getDbConfig } = require('../config/loader');

async function getNomeEmpresa() {
  return (await getDbConfig('empresa_nome')) || 'Oficina do TETEU';
}

async function menuSemAgendamento() {
  const custom = await getDbConfig('msg_menu_sem_agendamento');
  if (custom) return custom;
  const nome = await getNomeEmpresa();
  return (
    `*${nome}*\n\n` +
    `1) Agendar serviço\n` +
    `2) Falar com atendente\n` +
    `3) Encerrar`
  );
}

async function menuComAgendamento() {
  const custom = await getDbConfig('msg_menu_com_agendamento');
  if (custom) return custom;
  const nome = await getNomeEmpresa();
  return (
    `*${nome}*\n\n` +
    `Você tem um agendamento ativo.\n\n` +
    `1) Ver dados\n` +
    `2) Reagendar\n` +
    `3) Cancelar\n` +
    `4) Voltar ao menu principal`
  );
}

async function slotsHorario() {
  let horarios = null;
  try {
    const raw = await getDbConfig('horarios');
    if (raw) horarios = JSON.parse(raw);
  } catch {}

  if (!horarios || !horarios.length) {
    horarios = [
      { label: 'Segunda 08:00' },
      { label: 'Segunda 14:00' },
      { label: 'Terça 09:00' },
      { label: 'Quarta 10:00' },
      { label: 'Quinta 11:00' },
    ];
  }

  const linhas = horarios.map((h, i) => `${i + 1}) ${h.label}`).join('\n');
  return `Escolha o horário (número):\n\n${linhas}`;
}

async function confirmarAgendamento({ horarioLabel, descricao }) {
  return `Confirma o agendamento?\n\nServiço: ${descricao}\nHorário: ${horarioLabel}\n\n1) Sim\n2) Não`;
}

module.exports = { menuSemAgendamento, menuComAgendamento, slotsHorario, confirmarAgendamento };
