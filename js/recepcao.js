import { supabase } from './supabase-client.js';

const telaLogin = document.getElementById('tela-login');
const telaPainel = document.getElementById('tela-painel');
const ROTULOS_CARGO = { recepcao: 'Recepção', veterinaria: 'Veterinária' };
const NOMES_DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

let cargoAtual = null;

function mostrarLogin(){
  telaLogin.style.display = '';
  telaPainel.style.display = 'none';
}

function mostrarPainel(membro){
  cargoAtual = membro.cargo;
  telaLogin.style.display = 'none';
  telaPainel.style.display = '';
  document.getElementById('painel-usuario').textContent =
    `${membro.nome} · ${ROTULOS_CARGO[membro.cargo] || membro.cargo}`;
  carregarPendentes();
    carregarDesativados();
}

// Confirma ou recusa um pré-agendamento
async function decidir(a, novoStatus){
  const verbo = novoStatus === 'confirmado' ? 'confirmar' : 'recusar';
  if (!confirm(`Deseja ${verbo} este agendamento?`)) return;

  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status: novoStatus })
    .eq('id', a.id)
    .eq('status', 'aguardando')
    .select();

  if (error) {
    alert('Erro: ' + error.message);
    return;
  }
  if (!data || data.length === 0) {
    alert('Este agendamento já foi alterado (talvez o cliente tenha cancelado). A lista vai ser atualizada.');
  }
  carregarPendentes();
}

// Lista os pré-agendamentos aguardando
async function carregarPendentes(){
  const lista = document.getElementById('lista-pendentes');
  lista.textContent = 'Carregando...';

  const { data: pendentes, error } = await supabase
    .from('agendamentos')
    .select('*, pets(nome, peso, convenio_nome), responsaveis(nome, telefone)')
    .eq('status', 'aguardando')
    .order('data', { ascending: true })
    .order('horario', { ascending: true });

  lista.textContent = '';

  if (error) {
    lista.textContent = 'Erro ao carregar: ' + error.message;
    return;
  }
  if (!pendentes || pendentes.length === 0) {
    lista.textContent = 'Nenhum pré-agendamento aguardando. ✔';
    return;
  }

  pendentes.forEach(a => {
    const linha = document.createElement('div');
    linha.className = 'req-row';

    const info = document.createElement('div');
    info.className = 'req-info';

    const quem = document.createElement('div');
    quem.className = 'req-quem';
    const nomeTutor = a.responsaveis ? a.responsaveis.nome : '';
    const nomePet = a.pets ? a.pets.nome : '';
    const pesoPet = a.pets && a.pets.peso ? ` (${a.pets.peso} kg)` : '';
    quem.textContent = `${nomeTutor} · ${nomePet}${pesoPet}`;

    const [, mes, dia] = a.data.split('-');
    const diaSemana = NOMES_DIAS[new Date(a.data + 'T12:00:00').getDay()];
    const partes = [a.servico, `${diaSemana} ${dia}/${mes} às ${a.horario.slice(0, 5)}`];
    if (a.detalhes) partes.push(a.detalhes);
    if (a.forma_pagamento === 'convenio') {
      const nomeConvenio = a.pets && a.pets.convenio_nome ? ` (${a.pets.convenio_nome})` : '';
      partes.push('Convênio' + nomeConvenio);
    } else if (a.valor_estimado !== null) {
      partes.push(`R$ ${a.valor_estimado} (estimativa)`);
    }

    const quando = document.createElement('div');
    quando.className = 'req-quando';
    quando.textContent = partes.join(' · ');

    info.appendChild(quem);
    info.appendChild(quando);

    if (a.responsaveis && a.responsaveis.telefone) {
      const tel = document.createElement('div');
      tel.className = 'req-quando';
      tel.textContent = 'Tel: ' + a.responsaveis.telefone;
      info.appendChild(tel);
    }

    linha.appendChild(info);

    // Só a recepção pode confirmar ou recusar
    if (cargoAtual === 'recepcao') {
      const acoes = document.createElement('div');
      acoes.className = 'req-actions';

      const btnOk = document.createElement('button');
      btnOk.className = 'btn-ok';
      btnOk.textContent = 'Confirmar';
      btnOk.addEventListener('click', () => decidir(a, 'confirmado'));

      const btnNo = document.createElement('button');
      btnNo.className = 'btn-no';
      btnNo.textContent = 'Recusar';
      btnNo.addEventListener('click', () => decidir(a, 'recusado'));

      acoes.appendChild(btnOk);
      acoes.appendChild(btnNo);
      linha.appendChild(acoes);
    }

    lista.appendChild(linha);
  });
}
async function carregarDesativados(){
  const lista = document.getElementById('lista-desativados');
  if (cargoAtual !== 'recepcao') {
    lista.textContent = 'Somente a recepção pode ver e reativar cadastros.';
    return;
  }

  lista.textContent = 'Carregando...';

  const { data: desativados, error } = await supabase
    .from('responsaveis')
    .select('*')
    .eq('status', 'desativado')
        .order('criado_em', { ascending: false })
    .limit(20);

  lista.textContent = '';

  if (error) {
    lista.textContent = 'Erro ao carregar: ' + error.message;
    return;
  }
  if (!desativados || desativados.length === 0) {
    lista.textContent = 'Nenhum cadastro desativado.';
    return;
  }

  desativados.forEach(r => {
    const linha = document.createElement('div');
    linha.className = 'req-row';

    const info = document.createElement('div');
    info.className = 'req-info';
    const nome = document.createElement('div');
    nome.className = 'req-quem';
    nome.textContent = r.nome;
    const motivo = document.createElement('div');
    motivo.className = 'req-quando';
    motivo.textContent = 'Motivo: ' + (r.motivo_cancelamento || 'não informado');
    info.appendChild(nome);
    info.appendChild(motivo);

    const btnReativar = document.createElement('button');
    btnReativar.className = 'btn-ok';
    btnReativar.textContent = 'Reativar';
    btnReativar.addEventListener('click', async () => {
      if (!confirm(`Reativar o cadastro de ${r.nome}?`)) return;

      const { error: erroResp } = await supabase
        .from('responsaveis')
        .update({ status: 'ativo', motivo_cancelamento: null })
        .eq('id', r.id);

      if (erroResp) {
        alert('Erro ao reativar: ' + erroResp.message);
        return;
      }

      carregarDesativados();
    });

    linha.appendChild(info);
    linha.appendChild(btnReativar);
    lista.appendChild(linha);
  });
}

// Confere se quem está logado é da equipe
async function verificarAcesso(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    mostrarLogin();
    return;
  }

  const { data: membro } = await supabase
    .from('equipe')
    .select('nome, cargo, ativo')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!membro || !membro.ativo) {
    await supabase.auth.signOut();
    mostrarLogin();
    alert('Esta conta não tem acesso ao painel da equipe.');
    return;
  }

  mostrarPainel(membro);
}

document.getElementById('form-login-equipe').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { error } = await supabase.auth.signInWithPassword({
    email: document.getElementById('eq-email').value,
    password: document.getElementById('eq-senha').value
  });

  if (error) {
    alert('Não foi possível entrar: ' + error.message);
    return;
  }

  await verificarAcesso();
});

document.getElementById('btn-atualizar').addEventListener('click', carregarPendentes);
document.getElementById('btn-atualizar-desativados').addEventListener('click', carregarDesativados);

document.getElementById('btn-sair-painel').addEventListener('click', async () => {
  await supabase.auth.signOut();
  mostrarLogin();
});

// Busca de pets/tutores para ver e anexar documentos
let timeoutBusca = null;

document.getElementById('busca-doc').addEventListener('input', function(){
  clearTimeout(timeoutBusca);
  const termo = this.value.trim();
  timeoutBusca = setTimeout(() => buscarPets(termo), 400);
});

async function buscarPets(termo){
  const resultado = document.getElementById('resultado-busca-doc');

  if (!termo) {
    resultado.innerHTML = '';
    return;
  }

  resultado.textContent = 'Buscando...';

  const { data: pets, error } = await supabase
    .from('pets')
    .select('*, responsaveis(nome)')
    .or(`nome.ilike.%${termo}%`)
    .limit(10);

  if (error) {
    resultado.textContent = 'Erro na busca: ' + error.message;
    return;
  }

  // Filtra também pelo nome do tutor, já que o Supabase não faz "or" entre tabelas ligadas
  const { data: porTutor } = await supabase
    .from('responsaveis')
    .select('id, nome')
    .ilike('nome', `%${termo}%`);

  let petsDosTutores = [];
  if (porTutor && porTutor.length > 0) {
    const idsTutores = porTutor.map(r => r.id);
    const { data: petsExtra } = await supabase
      .from('pets')
      .select('*, responsaveis(nome)')
      .in('responsavel_id', idsTutores);
    petsDosTutores = petsExtra || [];
  }

  const todos = [...(pets || []), ...petsDosTutores];
  const semRepetir = Array.from(new Map(todos.map(p => [p.id, p])).values());

  resultado.innerHTML = '';

  if (semRepetir.length === 0) {
    resultado.textContent = 'Nenhum pet encontrado.';
    return;
  }

  semRepetir.forEach(pet => renderPetComDocumentos(pet, resultado));
}

async function renderPetComDocumentos(pet, container){
  const card = document.createElement('div');
  card.className = 'doc-busca-item';

  const nome = document.createElement('div');
  nome.className = 'doc-busca-nome';
  nome.textContent = `${pet.nome} · ${pet.responsaveis ? pet.responsaveis.nome : ''}`;

  const meta = document.createElement('div');
  meta.className = 'doc-busca-meta';
  meta.textContent = `${pet.raca || ''} · ${pet.peso} kg`;

  card.appendChild(nome);
  card.appendChild(meta);

  const listaMini = document.createElement('div');
  listaMini.className = 'doc-lista-mini';
  listaMini.textContent = 'Carregando documentos...';
  card.appendChild(listaMini);

  // Upload, só para quem é da recepção
  if (cargoAtual === 'recepcao') {
    const inputArquivo = document.createElement('input');
    inputArquivo.type = 'file';
    inputArquivo.accept = '.pdf,image/*';
    inputArquivo.className = 'input-arquivo-recepcao';
    inputArquivo.addEventListener('change', async function(){
      const arquivo = this.files[0];
      if (!arquivo) return;

      const caminho = `${pet.responsavel_id}/${Date.now()}-${arquivo.name}`;

      const { error: erroUpload } = await supabase.storage
        .from('documentos')
        .upload(caminho, arquivo);

      if (erroUpload) {
        alert('Erro ao enviar: ' + erroUpload.message);
        return;
      }

      const { error: erroRegistro } = await supabase.from('documentos').insert({
        pet_id: pet.id,
        responsavel_id: pet.responsavel_id,
        nome_arquivo: arquivo.name,
        arquivo_url: caminho,
        enviado_por: 'clinica'
      });

      if (erroRegistro) {
        alert('Arquivo enviado, mas houve erro ao registrar: ' + erroRegistro.message);
        return;
      }

      alert('Documento enviado para ' + pet.nome + '!');
      carregarDocumentosDoPet(pet.id, listaMini);
    });
    card.appendChild(inputArquivo);
  }

  container.appendChild(card);
  carregarDocumentosDoPet(pet.id, listaMini);
}

async function carregarDocumentosDoPet(petId, container){
  const { data: docs, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('pet_id', petId)
    .order('criado_em', { ascending: false });

  container.innerHTML = '';

  if (error) {
    container.textContent = 'Erro ao carregar documentos.';
    return;
  }
  if (!docs || docs.length === 0) {
    container.textContent = 'Nenhum documento anexado ainda.';
    return;
  }

  docs.forEach(d => {
    const linha = document.createElement('div');
    linha.className = 'doc-mini-item';

    const nome = document.createElement('span');
    const quem = d.enviado_por === 'clinica' ? 'clínica' : 'cliente';
    nome.textContent = `${d.nome_arquivo} (${quem})`;

    const link = document.createElement('a');
    link.href = '#';
    link.textContent = 'Abrir';
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const { data: linkTemp, error: erroLink } = await supabase.storage
        .from('documentos')
        .createSignedUrl(d.arquivo_url, 60);

      if (erroLink) {
        alert('Não foi possível abrir: ' + erroLink.message);
        return;
      }
      window.open(linkTemp.signedUrl, '_blank');
    });

    linha.appendChild(nome);
    linha.appendChild(link);
    container.appendChild(linha);
  });
}

verificarAcesso();