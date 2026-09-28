import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// Nome no topo
const { data: responsavel } = await supabase
  .from('responsaveis')
  .select('nome')
  .eq('id', userId)
  .single();
document.getElementById('nome-usuario').textContent = responsavel ? responsavel.nome : '';

function formatarData(iso){
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Pacote ativo
const areaPacote = document.getElementById('area-pacote');
const { data: pacotes } = await supabase
  .from('pacotes')
  .select('*, pets(nome)')
  .eq('responsavel_id', userId)
  .eq('status', 'ativo')
  .order('criado_em', { ascending: false })
  .limit(1);

if (!pacotes || pacotes.length === 0) {
  const vazio = document.createElement('div');
  vazio.className = 'pkg-meta';
  vazio.textContent = 'Você não tem nenhum pacote ativo no momento.';
  areaPacote.appendChild(vazio);
} else {
  const p = pacotes[0];

  const card = document.createElement('div');
  card.className = 'pkg-card';

  const nome = document.createElement('div');
  nome.className = 'pkg-name';
  nome.textContent = `Banho e Tosa — ${p.pets ? p.pets.nome : ''} (porte ${p.porte})`;

  const track = document.createElement('div');
  track.className = 'pkg-track';
  for (let i = 0; i < p.sessoes_total; i++) {
    const dot = document.createElement('div');
    dot.className = 'pkg-dot' + (i < p.sessoes_usadas ? ' used' : '');
    track.appendChild(dot);
  }

  const meta = document.createElement('div');
  meta.className = 'pkg-meta';
  meta.textContent = `${p.sessoes_usadas} de ${p.sessoes_total} usados · válido até ${formatarData(p.validade)}`;

  card.appendChild(nome);
  card.appendChild(track);
  card.appendChild(meta);
  areaPacote.appendChild(card);
}

// Cancelar um agendamento
async function cancelarAgendamento(a){
  const inicio = new Date(`${a.data}T${a.horario}`);
  const horasRestantes = (inicio - new Date()) / (1000 * 60 * 60);

  let aviso = 'Deseja cancelar este agendamento?';
  if (horasRestantes < 24) {
    aviso += '\n\nAtenção: cancelamentos com menos de 24 horas de antecedência podem ter taxa de cancelamento, conforme a política da clínica.';
  }
  if (!confirm(aviso)) return;

  const { error } = await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('id', a.id);

  if (error) {
    alert('Não foi possível cancelar: ' + error.message);
    return;
  }

  window.location.reload();
}

// Histórico de agendamentos
const container = document.getElementById('lista-historico');
const { data: agendamentos } = await supabase
  .from('agendamentos')
  .select('*, pets(nome)')
  .eq('responsavel_id', userId)
  .order('data', { ascending: false });

if (!agendamentos || agendamentos.length === 0) {
  const vazioHist = document.createElement('div');
  vazioHist.className = 'pkg-meta';
  vazioHist.textContent = 'Nenhum agendamento ainda.';
  container.appendChild(vazioHist);
} else {
  const rotulos = { aguardando: 'Aguardando', confirmado: 'Confirmado', recusado: 'Recusado', concluido: 'Concluído', cancelado: 'Cancelado' };

  agendamentos.forEach(a => {
    const linha = document.createElement('div');
    linha.className = 'hist-item';

    const desc = document.createElement('span');
    desc.className = 'hist-info';
    const [, mes, dia] = a.data.split('-');
    desc.textContent = `${a.pets ? a.pets.nome : ''} · ${a.servico} — ${dia}/${mes}`;

    const status = document.createElement('span');
    if (a.status === 'concluido' || a.status === 'confirmado') status.className = 'st-ok';
    else if (a.status === 'cancelado' || a.status === 'recusado') status.className = 'st-cancel';
    else status.className = 'st-wait';
    status.textContent = rotulos[a.status] || a.status;

    linha.appendChild(desc);
    linha.appendChild(status);

    // Só mostra o botão se ainda dá para cancelar
    const ehFuturo = new Date(`${a.data}T${a.horario}`) > new Date();
    if ((a.status === 'aguardando' || a.status === 'confirmado') && ehFuturo) {
      const btn = document.createElement('button');
      btn.className = 'btn-cancelar-ag';
      btn.textContent = 'Cancelar';
      btn.addEventListener('click', () => cancelarAgendamento(a));
      linha.appendChild(btn);
    }

    container.appendChild(linha);
  });
}

document.getElementById('btn-comunidade').addEventListener('click', () => {
  window.location.href = 'https://chat.whatsapp.com/K6ysecIycGJ27xf0GINMhS';
});
document.getElementById('btn-config').addEventListener('click', () => window.location.href = 'configuracoes.html');
document.getElementById('nav-home').addEventListener('click', () => window.location.href = 'inicio.html');
document.getElementById('nav-pets').addEventListener('click', () => window.location.href = 'meus-pets.html');