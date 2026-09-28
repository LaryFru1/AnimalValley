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

document.getElementById('btn-sair-painel').addEventListener('click', async () => {
  await supabase.auth.signOut();
  mostrarLogin();
});

verificarAcesso();