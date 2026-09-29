import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

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

// Documentos — um resumo por pet, cada um leva para a pastinha dele
const { data: petsDoUsuario } = await supabase
  .from('pets')
  .select('id, nome')
  .eq('responsavel_id', userId)
  .eq('status', 'ativo');

const listaPetsDocs = document.getElementById('lista-pets-docs');

if (!petsDoUsuario || petsDoUsuario.length === 0) {
  listaPetsDocs.textContent = 'Cadastre um pet para começar a guardar documentos.';
} else {
  for (const pet of petsDoUsuario) {
    const { count } = await supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', pet.id);

    const linha = document.createElement('div');
    linha.className = 'doc-item';
    linha.style.cursor = 'pointer';

    const ic = document.createElement('span');
    ic.className = 'doc-ic';
    ic.textContent = '📁';

    const texto = document.createElement('div');
    const nomeEl = document.createElement('div');
    nomeEl.className = 'doc-name';
    nomeEl.textContent = pet.nome;
    const metaEl = document.createElement('div');
    metaEl.className = 'doc-meta';
    metaEl.textContent = `${count || 0} documento(s)`;
    texto.appendChild(nomeEl);
    texto.appendChild(metaEl);

    linha.appendChild(ic);
    linha.appendChild(texto);
    linha.addEventListener('click', () => {
      window.location.href = `documentos-pet.html?id=${pet.id}`;
    });

    listaPetsDocs.appendChild(linha);
  }
}

document.getElementById('btn-agendar').addEventListener('click', () => window.location.href = 'escolher-pet.html');
document.getElementById('btn-comunidade').addEventListener('click', () => window.location.href = 'https://chat.whatsapp.com/K6ysecIycGJ27xf0GINMhS');
document.getElementById('nav-pets').addEventListener('click', () => window.location.href = 'meus-pets.html');
document.getElementById('nav-conta').addEventListener('click', () => window.location.href = 'conta.html');