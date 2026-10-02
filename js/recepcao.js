import { supabase } from './supabase-client.js';

const telaLogin = document.getElementById('tela-login');
const telaPainel = document.getElementById('tela-painel');
const ROTULOS_CARGO = { recepcao: 'Recepção', veterinaria: 'Veterinária', dono: 'Dono(a)' };
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
    carregarAgendaHoje();
    carregarProfissionaisNoSelect();
  carregarBloqueios();

  if (cargoAtual === 'veterinaria') {
    document.getElementById('secao-bloqueios').querySelectorAll('h3')[0].nextElementSibling;
    // Veterinária não vê a seção de documentos nem desativados, só a de bloqueios
  }
}

async function decidir(a, novoStatus){
  if (novoStatus === 'recusado') {
    const quer = confirm('Esta pessoa precisa ser reagendada para outro horário (evita duplicidade)?\n\nOK = Reagendar agora\nCancelar = Apenas recusar, sem reagendar');
    if (quer) {
      const dataISO = pedirDataValida('Nova data para este agendamento');
      if (!dataISO) return;
      const novaHora = pedirHoraValida('Novo horário');
      if (!novaHora) return;

      const { error } = await supabase
        .from('agendamentos')
        .update({ data: dataISO, horario: novaHora })
        .eq('id', a.id)
        .eq('status', 'aguardando');

      if (error) { alert('Erro ao reagendar: ' + error.message); return; }
      alert('Agendamento reagendado! Ele continua como pendente, para você confirmar depois.');
      carregarPendentes();
      return;
    }
  }

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

    if (cargoAtual === 'recepcao' || cargoAtual === 'dono') {
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

function pedirDataValida(mensagemInicial){
  let texto = prompt(mensagemInicial + ' (dd/mm/aaaa):');
  while (texto !== null && !/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    texto = prompt('Data inválida. Use o formato dd/mm/aaaa:', texto);
  }
  if (texto === null) return null;
  const [dia, mes, ano] = texto.split('/');
  return `${ano}-${mes}-${dia}`;
}

function pedirHoraValida(mensagemInicial){
  let texto = prompt(mensagemInicial + ' (hh:mm):');
  while (texto !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) {
    texto = prompt('Horário inválido. Use o formato hh:mm, de 00:00 a 23:59:', texto);
  }
  return texto;
}

function hojeISOData(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function carregarAgendaHoje(){
  const lista = document.getElementById('lista-agenda-hoje');
  lista.textContent = 'Carregando...';

  const hoje = hojeISOData();

  const { data: confirmados } = await supabase
    .from('agendamentos')
    .select('*, pets(nome), responsaveis(nome, telefone), profissionais(nome)')
    .eq('data', hoje)
    .eq('status', 'confirmado')
    .order('horario', { ascending: true });

  const { data: bloqueios } = await supabase
    .from('bloqueios')
    .select('*, profissionais(nome)')
    .eq('data', hoje)
    .not('hora_inicio', 'is', null)
    .order('hora_inicio', { ascending: true });

   const itens = [
    ...(confirmados || []).map(a => ({
      tipo: 'agendamento',
      id: a.id,
      telefone: a.responsaveis ? a.responsaveis.telefone : null,
      horario: a.horario.slice(0,5),
      texto: `${a.responsaveis ? a.responsaveis.nome : ''} · ${a.pets ? a.pets.nome : ''}`,
      meta: `${a.servico} · ${a.profissionais ? a.profissionais.nome : ''}${a.responsaveis && a.responsaveis.telefone ? ' · Tel: ' + a.responsaveis.telefone : ''}`
    })),
    ...(bloqueios || []).map(b => ({
      tipo: 'bloqueio',
      horario: b.hora_inicio.slice(0,5),
      texto: `${b.cliente_nome || 'Bloqueio'} · ${b.pet_nome || ''}`,
      meta: `${b.servico || b.motivo} · ${b.profissionais ? b.profissionais.nome : ''} (agendado por telefone/manual)`
    }))
  ].sort((x, y) => x.horario.localeCompare(y.horario));

  lista.innerHTML = '';

  if (itens.length === 0) {
    lista.textContent = 'Nada agendado para hoje ainda.';
    return;
  }

  itens.forEach(item => {
    const linha = document.createElement('div');
    linha.className = 'req-row';
    const info = document.createElement('div');
    info.className = 'req-info';
    const titulo = document.createElement('div');
    titulo.className = 'req-quem';
    titulo.textContent = `${item.horario} · ${item.texto}`;
    const meta = document.createElement('div');
    meta.className = 'req-quando';
    meta.textContent = item.meta;
    info.appendChild(titulo);
    info.appendChild(meta);
    linha.appendChild(info);

    if (item.tipo === 'agendamento' && (cargoAtual === 'recepcao' || cargoAtual === 'dono')) {
      const acoes = document.createElement('div');
      acoes.className = 'req-actions';

      if (item.telefone) {
        const btnWhats = document.createElement('button');
        btnWhats.className = 'btn-no';
        btnWhats.textContent = '💬 WhatsApp';
        btnWhats.addEventListener('click', () => {
          const numero = '55' + item.telefone.replace(/\D/g, '');
          const texto = encodeURIComponent(`Olá! Aqui é da Animal Valley. Precisamos conversar sobre o seu agendamento de hoje às ${item.horario}.`);
          window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
        });
        acoes.appendChild(btnWhats);
      }

      const btnReagendar = document.createElement('button');
      btnReagendar.className = 'btn-ok';
      btnReagendar.textContent = 'Reagendar';
          btnReagendar.addEventListener('click', async () => {
        const dataISO = pedirDataValida('Nova data');
        if (!dataISO) return;
        const novaHora = pedirHoraValida('Novo horário');
        if (!novaHora) return;

        const { error } = await supabase
          .from('agendamentos')
          .update({ data: dataISO, horario: novaHora })
          .eq('id', item.id);

        if (error) { alert('Erro ao reagendar: ' + error.message); return; }

        alert('Agendamento atualizado!');
        carregarAgendaHoje();
      });

      acoes.appendChild(btnCancelarAg);
      acoes.appendChild(btnReagendar);
      const btnCancelarAg = document.createElement('button');
      btnCancelarAg.className = 'btn-no';
      btnCancelarAg.textContent = 'Cancelar';
      btnCancelarAg.addEventListener('click', async () => {
        if (!confirm('Cancelar este agendamento?')) return;
        const { error } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', item.id);
        if (error) { alert('Erro ao cancelar: ' + error.message); return; }
        carregarAgendaHoje();
      });
      acoes.appendChild(btnCancelarAg);

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
    window.open(`documentos-pet.html?id=${pet.id}`, 'painel-documentos-pet');
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

document.getElementById('eq-esqueci').addEventListener('click', async function(){
  const email = prompt('Digite o e-mail cadastrado da equipe:');
  if (!email) return;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/redefinir-senha.html'
  });

  if (error) {
    alert('Erro: ' + error.message);
  } else {
    alert('Se esse e-mail estiver cadastrado, um link de redefinição foi enviado!');
  }
});

document.getElementById('btn-atualizar').addEventListener('click', carregarPendentes);
document.getElementById('btn-atualizar-desativados').addEventListener('click', carregarDesativados);
document.getElementById('btn-atualizar-agenda-hoje').addEventListener('click', carregarAgendaHoje);

document.getElementById('btn-sair-painel').addEventListener('click', async () => {
  await supabase.auth.signOut();
  mostrarLogin();
});

// --------- Bloqueios de agenda ---------

document.getElementById('bloq-data').addEventListener('input', function(){
  let v = this.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  this.value = v;
});

function converterDataBloqueio(dataTexto){
  const [dia, mes, ano] = dataTexto.split('/');
  return `${ano}-${mes}-${dia}`;
}
async function carregarProfissionaisNoSelect(){
  const select = document.getElementById('bloq-profissional');
  select.innerHTML = '';

  let query = supabase.from('profissionais').select('id, nome, equipe_id').eq('ativo', true);

  // Veterinária só vê (e só pode escolher) a própria agenda
  if (cargoAtual === 'veterinaria') {
    const { data: { session } } = await supabase.auth.getSession();
    query = query.eq('equipe_id', session.user.id);
  }

  const { data: profissionais } = await query;

  (profissionais || []).forEach(p => {
    const opcao = document.createElement('option');
    opcao.value = p.id;
    opcao.textContent = p.nome;
    select.appendChild(opcao);
  });
}

document.getElementById('bloq-tipo').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');

  const ehHorario = opt.dataset.value === 'horario';
  document.getElementById('bloq-horarios').style.display = ehHorario ? 'block' : 'none';
  document.getElementById('bloq-dados-cliente').style.display = ehHorario ? 'block' : 'none';
});

document.getElementById('btn-criar-bloqueio').addEventListener('click', async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const tipo = document.querySelector('#bloq-tipo .toggle-opt.picked').dataset.value;
  const profissionalId = document.getElementById('bloq-profissional').value;
    const dataDigitada = document.getElementById('bloq-data').value;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataDigitada)) {
    alert('Data inválida. Use o formato dd/mm/aaaa.');
    return;
  }
  const data = converterDataBloqueio(dataDigitada);
  const motivo = document.getElementById('bloq-motivo').value.trim();

  if (!profissionalId || !data || !motivo) {
    alert('Preencha profissional, data e motivo.');
    return;
  }

  const registro = {
    profissional_id: profissionalId,
    data: data,
    motivo: motivo,
    criado_por: session.user.id
  };

  if (tipo === 'horario') {
        const nomeResponsavel = document.getElementById('bloq-cliente').value.trim();
    if (!nomeResponsavel) { alert('Informe o nome do responsável.'); return; }
        const nomePet = document.getElementById('bloq-pet').value.trim();
    const servicoCombinado = document.getElementById('bloq-servico').value.trim();
    if (!nomePet) { alert('Informe o nome do pet.'); return; }
    if (!servicoCombinado) { alert('Informe o serviço combinado.'); return; }
    const inicio = document.getElementById('bloq-inicio').value;
    const fim = document.getElementById('bloq-fim').value;
    if (!inicio || !fim) { alert('Preencha o horário de início e fim.'); return; }
    registro.hora_inicio = inicio;
    registro.hora_fim = fim;
        registro.cliente_nome = nomeResponsavel;
        registro.pet_nome = nomePet;
    registro.servico = servicoCombinado;
  }

  const { error } = await supabase.from('bloqueios').insert(registro);

  if (error) { alert('Erro ao bloquear: ' + error.message); return; }

  alert('Bloqueio criado!');
  document.getElementById('bloq-motivo').value = '';
  document.getElementById('bloq-cliente').value = '';
  document.getElementById('bloq-pet').value = '';
  document.getElementById('bloq-servico').value = '';
  carregarBloqueios();
});

async function carregarBloqueios(){
  const lista = document.getElementById('lista-bloqueios');
  lista.textContent = 'Carregando...';

  const hoje = new Date();
  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;

  const { data: bloqueios, error } = await supabase
    .from('bloqueios')
    .select('*, profissionais(nome)')
    .gte('data', hojeISO)
    .order('data', { ascending: true });

  lista.innerHTML = '';

  if (error) { lista.textContent = 'Erro ao carregar: ' + error.message; return; }
  if (!bloqueios || bloqueios.length === 0) { lista.textContent = 'Nenhum bloqueio futuro.'; return; }

  bloqueios.forEach(b => {
    const item = document.createElement('div');
    item.className = 'bloq-item';

    const info = document.createElement('div');
    info.className = 'info';

    const [ano, mes, dia] = b.data.split('-');
    const horarioTexto = b.hora_inicio ? `${b.hora_inicio.slice(0,5)}–${b.hora_fim.slice(0,5)}` : 'Dia inteiro';
    const profNome = b.profissionais ? b.profissionais.nome : '';

    const titulo = document.createElement('div');
    titulo.textContent = `${dia}/${mes} · ${profNome} · ${horarioTexto}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    let metaTexto = b.motivo;
    if (b.cliente_nome) metaTexto += ` · ${b.cliente_nome}${b.pet_nome ? ' (' + b.pet_nome + ')' : ''}`;
    if (b.servico) metaTexto += ` · ${b.servico}`;
    meta.textContent = metaTexto;

    info.appendChild(titulo);
    info.appendChild(meta);
    item.appendChild(info);

    // Só quem criou (se for veterinária) ou recepção/dono pode remover
    const podeRemover = cargoAtual === 'recepcao' || cargoAtual === 'dono';
    if (podeRemover) {
      const btnRemover = document.createElement('button');
      btnRemover.className = 'btn-editar';
      btnRemover.textContent = '🗑️';
      btnRemover.addEventListener('click', async () => {
        if (!confirm('Remover este bloqueio?')) return;
        await supabase.from('bloqueios').delete().eq('id', b.id);
        carregarBloqueios();
      });
      item.appendChild(btnRemover);
    }

    lista.appendChild(item);
  });
}
verificarAcesso();