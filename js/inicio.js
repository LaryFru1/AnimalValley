import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// Saudação
const { data: responsavel } = await supabase
  .from('responsaveis')
  .select('nome')
  .eq('id', userId)
  .single();

const primeiroNome = responsavel ? responsavel.nome.split(' ')[0] : '';
document.getElementById('saudacao').textContent = `Olá, ${primeiroNome} 👋`;

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

// Documentos e exames (os 3 mais recentes)
const listaDocs = document.getElementById('lista-docs');
const { data: docs } = await supabase
  .from('documentos')
  .select('*, pets(nome)')
  .eq('responsavel_id', userId)
  .order('criado_em', { ascending: false })
  .limit(3);

if (!docs || docs.length === 0) {
  const vazio = document.createElement('div');
  vazio.className = 'pkg-meta';
  vazio.textContent = 'Nenhum documento anexado ainda.';
  listaDocs.appendChild(vazio);
} else {
  docs.forEach(d => {
    const item = document.createElement('div');
    item.className = 'doc-item';

    const ic = document.createElement('span');
    ic.className = 'doc-ic';
    ic.textContent = '📄';

    const texto = document.createElement('div');
    const nome = document.createElement('div');
    nome.className = 'doc-name';
    nome.textContent = `${d.nome_arquivo}${d.pets ? ' — ' + d.pets.nome : ''}`;

    const meta = document.createElement('div');
    meta.className = 'doc-meta';
    const quem = d.enviado_por === 'clinica' ? 'Enviado pela clínica' : 'Você enviou';
    const dia = d.criado_em.slice(8, 10);
    const mes = d.criado_em.slice(5, 7);
    meta.textContent = `${quem} · ${dia}/${mes}`;

    texto.appendChild(nome);
    texto.appendChild(meta);
    item.appendChild(ic);
    item.appendChild(texto);
    listaDocs.appendChild(item);
  });
}

// Botões e navegação
document.getElementById('btn-agendar').addEventListener('click', () => window.location.href = 'escolher-pet.html');
document.getElementById('btn-comunidade').addEventListener('click', () => window.location.href = 'https://chat.whatsapp.com/K6ysecIycGJ27xf0GINMhS');
document.getElementById('btn-anexar').addEventListener('click', () => {
  alert('O envio de arquivos vai funcionar quando configurarmos o Supabase Storage.');
});
document.getElementById('nav-pets').addEventListener('click', () => window.location.href = 'meus-pets.html');
document.getElementById('nav-conta').addEventListener('click', () => window.location.href = 'conta.html');