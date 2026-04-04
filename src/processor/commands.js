'use strict';

const repos = require('../database/repos');
const { getDbConfig } = require('../config/loader');

function fmtData(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtPreco(v) {
  if (v == null) return '';
  return 'R$ ' + parseFloat(v).toFixed(2).replace('.', ',');
}

async function isAdmin(telefone) {
  const adminTel = ((await getDbConfig('admin_telefone', '')) || '').replace(/\D/g, '');
  const empresaTel = ((await getDbConfig('empresa_telefone', '')) || '').replace(/\D/g, '');
  const tel = String(telefone).replace(/\D/g, '');
  return (adminTel && tel === adminTel) || (empresaTel && tel === empresaTel);
}

async function processarComando(telefone, msg) {
  const m = msg.trim().toLowerCase();

  if (m === 'agenda hoje' || m === 'hoje') {
    const list = await repos.listAgendamentosHoje();
    if (!list.length) return ['📅 Nenhum agendamento para hoje.'];
    const linhas = list.map((a, i) =>
      `${i + 1}) ${fmtData(a.horario)} — ${a.nome || a.telefone}\n   ${a.servico || 'Serviço'}`
    );
    return ['📅 *Agenda de hoje:*\n\n' + linhas.join('\n\n')];
  }

  if (m === 'agenda semana' || m === 'semana') {
    const list = await repos.listAgendamentosSemana();
    if (!list.length) return ['📅 Nenhum agendamento para esta semana.'];
    const linhas = list.map((a, i) =>
      `${i + 1}) ${fmtData(a.horario)} — ${a.nome || a.telefone}\n   ${a.servico || 'Serviço'}`
    );
    return ['📅 *Agenda da semana:*\n\n' + linhas.join('\n\n')];
  }

  if (m === 'pendentes') {
    const list = await repos.listAgendamentosPendentes();
    if (!list.length) return ['✅ Nenhum agendamento pendente.'];
    const linhas = list.map((a, i) =>
      `${i + 1}) ${fmtData(a.horario)} — ${a.nome || a.telefone}\n   ${a.servico || 'Serviço'} [ID: ${a.id.slice(0, 8)}]`
    );
    return ['⏳ *Agendamentos pendentes:*\n\n' + linhas.join('\n\n')];
  }

  if (m === 'servicos') {
    const list = await repos.listServicos();
    if (!list.length) return ['Nenhum serviço cadastrado. Use: *+servico nome | categoria | preço*'];
    const linhas = list.map(s =>
      `• *${s.nome}*${s.categoria ? ` [${s.categoria}]` : ''}${s.preco ? ' — ' + fmtPreco(s.preco) : ''}${s.descricao ? '\n  ' + s.descricao : ''}`
    );
    return ['🔧 *Serviços cadastrados:*\n\n' + linhas.join('\n')];
  }

  if (m.startsWith('+servico ') || m.startsWith('+serviço ')) {
    const resto = msg.trim().slice(msg.trim().indexOf(' ') + 1);
    const partes = resto.split('|').map(p => p.trim());
    const nome = partes[0] || '';
    if (!nome) return ['❌ Use: *+servico nome | categoria | preço | descrição*'];
    const existing = await repos.findServicoPorNome(nome);
    if (existing) return [`❌ Serviço "${nome}" já existe.`];
    const categoria = partes[1] || null;
    const precoRaw = partes[2] ? partes[2].replace('R$', '').replace(',', '.').trim() : null;
    const preco = precoRaw ? parseFloat(precoRaw) : null;
    const descricao = partes[3] || null;
    await repos.insertServico({ nome, categoria, preco: isNaN(preco) ? null : preco, descricao });
    return [`✅ Serviço *${nome}* cadastrado!`];
  }

  if (m.startsWith('confirmar ')) {
    const partes = msg.trim().slice(10).split(' ').filter(Boolean);
    const nome = partes[0] || '';
    if (!nome) return ['❌ Use: *confirmar [nome/telefone] [horário dd/mm HH:mm]*'];
    const list = await repos.listAgendamentosPendentes();
    const match = list.find(a =>
      (a.nome && a.nome.toLowerCase().includes(nome.toLowerCase())) ||
      (a.telefone && a.telefone.includes(nome.replace(/\D/g, '')))
    );
    if (!match) return [`❌ Nenhum agendamento pendente encontrado para "${nome}".`];
    await repos.confirmarAgendamentoAdmin(match.id);
    return [`✅ Agendamento de *${match.nome || match.telefone}* confirmado para ${fmtData(match.horario)}.`];
  }

  if (m.startsWith('sugerir ')) {
    const partes = msg.trim().slice(8).trim().split(' ');
    const nomeTel = partes[0] || '';
    const horarioStr = partes.slice(1).join(' ');
    if (!nomeTel || !horarioStr) return ['❌ Use: *sugerir [nome/telefone] [horário ex: 15/04 10:00]*'];
    let cliente = await repos.findClienteByTelefone(nomeTel.replace(/\D/g, ''));
    if (!cliente) {
      const todos = await repos.adminListClientes();
      cliente = todos.find(c => c.nome && c.nome.toLowerCase().includes(nomeTel.toLowerCase())) || null;
    }
    if (!cliente) return [`❌ Cliente "${nomeTel}" não encontrado.`];
    return [`💬 Sugestão para *${cliente.nome || cliente.telefone}*: horário ${horarioStr}.\n\nEnvie uma mensagem manual para o cliente propondo este horário.`];
  }

  if (m.startsWith('encaixar ')) {
    const partes = msg.trim().slice(9).trim().split('|').map(p => p.trim());
    const horarioStr = partes[0] || '';
    const nomeTel = partes[1] || '';
    const servico = partes[2] || 'Encaixe';
    if (!horarioStr || !nomeTel) return ['❌ Use: *encaixar horário | nome/telefone | serviço*\nEx: encaixar 15/04 10:00 | João | Troca de óleo'];
    let cliente = await repos.findClienteByTelefone(nomeTel.replace(/\D/g, ''));
    if (!cliente) {
      const todos = await repos.adminListClientes();
      cliente = todos.find(c => c.nome && c.nome.toLowerCase().includes(nomeTel.toLowerCase())) || null;
    }
    if (!cliente) return [`❌ Cliente "${nomeTel}" não encontrado. Certifique-se que ele já enviou uma mensagem.`];

    const partesDt = horarioStr.match(/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (!partesDt) return ['❌ Formato de horário inválido. Use: dd/mm HH:mm'];
    const now = new Date();
    const dia = parseInt(partesDt[1]), mes = parseInt(partesDt[2]) - 1;
    const hora = partesDt[3] ? parseInt(partesDt[3]) : 9;
    const min = partesDt[4] ? parseInt(partesDt[4]) : 0;
    const horario = new Date(now.getFullYear(), mes, dia, hora, min, 0);

    await repos.insertAgendamentoAdmin({ cliente_id: cliente.id, horario, servico, descricao: 'Encaixe via admin' });
    return [`✅ Encaixe criado para *${cliente.nome || cliente.telefone}* em ${fmtData(horario)} — ${servico}`];
  }

  return null;
}

module.exports = { isAdmin, processarComando };
