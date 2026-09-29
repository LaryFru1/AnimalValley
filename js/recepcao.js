import { supabase } from './supabase-client.js';

const telaLogin = document.getElementById('tela-login');
const telaPainel = document.getElementById('tela-painel');
const ROTULOS_CARGO = { recepcao: 'Recepção', veterinaria: 'Veterinária' };
const NOMES_DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const NOMES_ESPECIE = { cao: 'Cão', gato: 'Gato', outro: 'Outro' };

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

async function decidir(a, novoStatus){
  const verbo = novoStatus === 'confirmado' ? 'confirmar' : 'recusar';
  if (!confirm(`Deseja ${verbo} este agendamento?`)) return;

  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status: novoStatus })
    .eq('id', a.id)
    .eq('status', 'aguardando')
    .select();

  if (error) { alert('Erro: ' + error.message); return; }
  if (!data || data.length === 0) {
    alert('Este agendamento já foi alterado. A lista vai ser atualizada.');
  }
  carregarPendentes();
}

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

  if (error) { lista.textContent = 'Erro ao carregar: ' + error.message; return; }
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
    .gte('desativado_em', new Date(Date.now() - 30*24*60*60*1000).toISOString())
    .order('criado_em', { ascending: false })
    .limit(20);

  lista.textContent = '';

  if (error) { lista.textContent = 'Erro ao carregar: ' + error.message; return; }
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

      if (erroResp) { alert('Erro ao reativar: ' + erroResp.message); return; }
      carregarDesativados();
    });

    linha.appendChild(info);
    linha.appendChild(btnReativar);
    lista.appendChild(linha);
  });
}

let timeoutBusca = null;

document.getElementById('busca-doc').addEventListener('input', function(){
  clearTimeout(timeoutBusca);
  const termo = this.value.trim();
  timeoutBusca = setTimeout(() => buscarPets(termo), 400);
});

async function buscarPets(termo){
  const resultado = document.getElementById('resultado-busca-doc');

  if (!termo) { resultado.innerHTML = ''; return; }
  resultado.textContent = 'Buscando...';

  const { data: pets, error } = await supabase
    .from('pets')
    .select('*, responsaveis(nome)')
    .eq('status', 'ativo')
    .or(`nome.ilike.%${termo}%`)
    .limit(10);

  if (error) { resultado.textContent = 'Erro na busca: ' + error.message; return; }

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
      .in('responsavel_id', idsTutores)
      .eq('status', 'ativo');
    petsDosTutores = petsExtra || [];
  }

  const todos = [...(pets || []), ...petsDosTutores];
  const semRepetir = Array.from(new Map(todos.map(p => [p.id, p])).values());

  resultado.innerHTML = '';

  if (semRepetir.length === 0) { resultado.textContent = 'Nenhum pet encontrado.'; return; }

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
  meta.textContent = `${NOMES_ESPECIE[pet.especie] || ''} · ${pet.raca || ''} · ${pet.peso} kg`;

  const { count } = await supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .eq('pet_id', pet.id);

  const contagem = document.createElement('div');
  contagem.className = 'doc-busca-meta';
  contagem.textContent = `${count || 0} documento(s)`;

  const btnVer = document.createElement('button');
  btnVer.className = 'ghost-btn';
  btnVer.style.marginTop = '8px';
  btnVer.textContent = '📁 Ver/gerenciar documentos';
  btnVer.addEventListener('click', () => {
    window.open(`documentos-pet.html?id=${pet.id}`, '_blank');
  });

  card.appendChild(nome);
  card.appendChild(meta);
  card.appendChild(contagem);
  card.appendChild(btnVer);
  container.appendChild(card);
}

async function verificarAcesso(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { mostrarLogin(); return; }

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

  if (error) { alert('Não foi possível entrar: ' + error.message); return; }
  await verificarAcesso();
});

document.getElementById('btn-atualizar').addEventListener('click', carregarPendentes);
document.getElementById('btn-atualizar-desativados').addEventListener('click', carregarDesativados);

document.getElementById('btn-sair-painel').addEventListener('click', async () => {
  await supabase.auth.signOut();
  mostrarLogin();
});

verificarAcesso();