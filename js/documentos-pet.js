import { supabase } from './supabase-client.js';

const petId = new URLSearchParams(window.location.search).get('id');

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

if (!petId) {
  window.location.href = 'inicio.html';
}

// Descobre se quem está logado é da equipe (e qual cargo) ou é cliente
const { data: membro } = await supabase
  .from('equipe')
  .select('cargo')
  .eq('id', userId)
  .maybeSingle();

const cargo = membro ? membro.cargo : 'cliente';

const { data: pet, error: erroPet } = await supabase
  .from('pets')
  .select('*, responsaveis(nome)')
  .eq('id', petId)
  .single();

if (erroPet || !pet) {
  alert('Não foi possível carregar este pet.');
  window.location.href = cargo === 'cliente' ? 'inicio.html' : 'recepcao.html';
}

document.getElementById('titulo').textContent = `Documentos — ${pet.nome}`;
document.getElementById('subtitulo').textContent = pet.responsaveis ? pet.responsaveis.nome : '';

document.getElementById('btn-voltar').addEventListener('click', () => {
  window.location.href = cargo === 'cliente' ? 'inicio.html' : 'recepcao.html';
});

// Só mostra o botão de anexar se: for o cliente dono do pet, ou for a recepção
const podeAnexar = (cargo === 'cliente' && pet.responsavel_id === userId) || cargo === 'recepcao';
if (podeAnexar) {
  document.getElementById('area-anexar').style.display = 'block';
}

async function carregarDocs(){
  const lista = document.getElementById('lista-docs');
  lista.textContent = 'Carregando...';

  const { data: docs, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('pet_id', petId)
    .order('criado_em', { ascending: false });

  lista.innerHTML = '';

  if (error) {
    lista.textContent = 'Erro ao carregar: ' + error.message;
    return;
  }
  if (!docs || docs.length === 0) {
    lista.textContent = 'Nenhum documento anexado ainda.';
    return;
  }

  docs.forEach(d => {
    const linha = document.createElement('div');
    linha.className = 'doc-mini-item';

    const nome = document.createElement('span');
    const quem = d.enviado_por === 'clinica' ? 'clínica' : 'cliente';
    nome.textContent = `${d.nome_arquivo} (${quem})`;

    const acoes = document.createElement('div');
    acoes.className = 'doc-mini-acoes';

    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Abrir';
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const { data: linkTemp, error: erroLink } = await supabase.storage
        .from('documentos')
        .createSignedUrl(d.arquivo_url, 60);
      if (erroLink) { alert('Não foi possível abrir: ' + erroLink.message); return; }
      window.open(linkTemp.signedUrl, '_blank');
    });
    acoes.appendChild(link);

    const podeExcluir = (cargo === 'cliente' && d.enviado_por === 'cliente') || cargo === 'recepcao';
    if (podeExcluir) {
      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = '🗑️';
      btnExcluir.className = 'btn-editar';
      btnExcluir.addEventListener('click', async () => {
        if (!confirm('Excluir este documento?')) return;
        await supabase.storage.from('documentos').remove([d.arquivo_url]);
        await supabase.from('documentos').delete().eq('id', d.id);
        carregarDocs();
      });
      acoes.appendChild(btnExcluir);
    }

    linha.appendChild(nome);
    linha.appendChild(acoes);
    lista.appendChild(linha);
  });
}

carregarDocs();

if (podeAnexar) {
  document.getElementById('doc-arquivo').addEventListener('change', async function(){
    const arquivo = this.files[0];
    if (!arquivo) return;

    const enviadoPor = cargo === 'cliente' ? 'cliente' : 'clinica';
    const caminho = `${pet.responsavel_id}/${Date.now()}-${arquivo.name}`;

    const { error: erroUpload } = await supabase.storage.from('documentos').upload(caminho, arquivo);
    if (erroUpload) { alert('Erro ao enviar: ' + erroUpload.message); return; }

    const { error: erroRegistro } = await supabase.from('documentos').insert({
      pet_id: petId,
      responsavel_id: pet.responsavel_id,
      nome_arquivo: arquivo.name,
      arquivo_url: caminho,
      enviado_por: enviadoPor
    });

    if (erroRegistro) { alert('Enviado, mas houve erro ao registrar: ' + erroRegistro.message); return; }

    alert('Documento enviado!');
    this.value = '';
    carregarDocs();
  });
}