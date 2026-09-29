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

// Carrega os pets no seletor, para escolher de quem é o documento
const { data: petsDoUsuario } = await supabase
  .from('pets')
  .select('id, nome')
  .eq('responsavel_id', userId)
  .eq('status', 'ativo');

const seletorPet = document.getElementById('doc-pet-select');
if (petsDoUsuario && petsDoUsuario.length > 0) {
  petsDoUsuario.forEach(p => {
    const opcao = document.createElement('option');
    opcao.value = p.id;
    opcao.textContent = p.nome;
    seletorPet.appendChild(opcao);
  });
} else {
  seletorPet.style.display = 'none';
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
        item.style.cursor = 'pointer';
    item.addEventListener('click', async () => {
      const { data: linkTemporario, error } = await supabase.storage
        .from('documentos')
        .createSignedUrl(d.arquivo_url, 60);

      if (error) {
        alert('Não foi possível abrir o arquivo: ' + error.message);
        return;
      }
      window.open(linkTemporario.signedUrl, '_blank');
    });
    listaDocs.appendChild(item);
  });
}

// Botões e navegação
document.getElementById('btn-agendar').addEventListener('click', () => window.location.href = 'escolher-pet.html');
document.getElementById('btn-comunidade').addEventListener('click', () => window.location.href = 'https://chat.whatsapp.com/K6ysecIycGJ27xf0GINMhS');
document.getElementById('btn-anexar').addEventListener('click', () => {
  if (!seletorPet.value && petsDoUsuario && petsDoUsuario.length > 0) {
    alert('Escolha o pet antes de anexar.');
    return;
  }
  document.getElementById('doc-arquivo').click();
});

document.getElementById('doc-arquivo').addEventListener('change', async function(){
  const arquivo = this.files[0];
  if (!arquivo) return;

  const petId = seletorPet.value;
  const caminho = `${userId}/${Date.now()}-${arquivo.name}`;

  const { error: erroUpload } = await supabase.storage
    .from('documentos')
    .upload(caminho, arquivo);

  if (erroUpload) {
    alert('Erro ao enviar o arquivo: ' + erroUpload.message);
    this.value = '';
    return;
  }

  const { error: erroRegistro } = await supabase.from('documentos').insert({
    pet_id: petId,
    responsavel_id: userId,
    nome_arquivo: arquivo.name,
    arquivo_url: caminho,
    enviado_por: 'cliente'
  });

  if (erroRegistro) {
    alert('Arquivo enviado, mas houve um erro ao registrar: ' + erroRegistro.message);
    this.value = '';
    return;
  }

  alert('Documento enviado!');
  window.location.reload();
});
document.getElementById('nav-pets').addEventListener('click', () => window.location.href = 'meus-pets.html');
document.getElementById('nav-conta').addEventListener('click', () => window.location.href = 'conta.html');