// Tabela de preços por porte (do catálogo da clínica)
const DURACOES = {
  P:  { banho:45,  banhoTosaMaquina:105, banhoTosaTesoura:135, tosaHigienica:10, tosaTesoura:90,  tosaMaquina:60,  hidratSimples:10, hidratPremium:10 },
  M:  { banho:60,  banhoTosaMaquina:150, banhoTosaTesoura:180, tosaHigienica:10, tosaTesoura:120, tosaMaquina:90,  hidratSimples:10, hidratPremium:10 },
  G:  { banho:90,  banhoTosaMaquina:210, banhoTosaTesoura:240, tosaHigienica:10, tosaTesoura:150, tosaMaquina:120, hidratSimples:10, hidratPremium:10 },
  GG: { banho:120, banhoTosaMaquina:270, banhoTosaTesoura:300, tosaHigienica:10, tosaTesoura:180, tosaMaquina:150, hidratSimples:10, hidratPremium:10 }
};
const PRECOS = {
  P:  { banho:65,  banhoTosaMaquina:100, banhoTosaTesoura:125, tosaHigienica:20, tosaTesoura:70,  tosaMaquina:45,  hidratSimples:15, hidratPremium:25, pacote:200 },
  M:  { banho:75,  banhoTosaMaquina:125, banhoTosaTesoura:155, tosaHigienica:30, tosaTesoura:90,  tosaMaquina:55,  hidratSimples:20, hidratPremium:30, pacote:230 },
  G:  { banho:100, banhoTosaMaquina:150, banhoTosaTesoura:185, tosaHigienica:40, tosaTesoura:120, tosaMaquina:70,  hidratSimples:30, hidratPremium:40, pacote:305 },
  GG: { banho:150, banhoTosaMaquina:220, banhoTosaTesoura:250, tosaHigienica:50, tosaTesoura:150, tosaMaquina:100, hidratSimples:40, hidratPremium:50, pacote:445 }
};

function calcularPorte(peso){
  if (peso <= 10) return 'P';
  if (peso <= 20) return 'M';
  if (peso <= 30) return 'G';
  return 'GG';
}

const nomePet = sessionStorage.getItem('petEscolhido') || 'seu pet';
const peso = parseFloat(sessionStorage.getItem('petPeso')) || 5;
const porte = calcularPorte(peso);
const precos = PRECOS[porte];
const duracoes = DURACOES[porte];

document.getElementById('titulo').textContent = `Banho e tosa — ${nomePet} (porte ${porte})`;
document.getElementById('pkg-nome').textContent = `Pacote — porte ${porte} (R$ ${precos.pacote})`;

const LIMITES = { P:'até 10kg', M:'até 20kg', G:'até 30kg', GG:'acima de 30kg' };

const itens = [
  { chave:'banho', nome:'Banho', meta:`porte ${porte} · ${LIMITES[porte]}` },
  { chave:'banhoTosaMaquina', nome:'Banho + Tosa Máquina', meta:`porte ${porte} · ${LIMITES[porte]}` },
  { chave:'banhoTosaTesoura', nome:'Banho + Tosa Tesoura', meta:`porte ${porte} · ${LIMITES[porte]}` },
  { chave:'tosaHigienica', nome:'Tosa Higiênica', meta:'patas e região íntima' },
  { chave:'tosaTesoura', nome:'Tosa Tesoura', meta:`porte ${porte} · ${LIMITES[porte]}` },
  { chave:'tosaMaquina', nome:'Tosa Máquina', meta:`porte ${porte} · ${LIMITES[porte]}` },
  { chave:'hidratSimples', nome:'Hidratação Simples', meta:`porte ${porte} · ${LIMITES[porte]}` },
  { chave:'hidratPremium', nome:'Hidratação Premium', meta:`porte ${porte} · ${LIMITES[porte]}` }
];

const container = document.getElementById('lista-itens');
const selecionados = new Set();

itens.forEach(item => {
  const div = document.createElement('div');
  div.className = 'svc-item';
  div.innerHTML = `
    <div><div class="name">${item.nome}</div><div class="meta">${item.meta}</div></div>
    <div style="display:flex;align-items:center;gap:8px">
      <span class="price">R$ ${precos[item.chave]}</span>
      <div class="check-sq"></div>
    </div>
  `;
  div.addEventListener('click', () => {
    div.classList.toggle('picked');
    if (selecionados.has(item.chave)) selecionados.delete(item.chave);
    else selecionados.add(item.chave);
    atualizarTotal();
  });
  container.appendChild(div);
});

function formaAtual(){
  return document.querySelector('#toggle-forma .toggle-opt.picked').dataset.value;
}

function atualizarTotal(){
  const totalEl = document.getElementById('total');
  if (formaAtual() === 'pacote') {
    totalEl.textContent = 'R$ ' + precos.pacote;
  } else {
    let total = 0;
    selecionados.forEach(chave => total += precos[chave]);
    totalEl.textContent = 'R$ ' + total;
  }
}

document.getElementById('toggle-forma').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');

  const infoPacote = document.getElementById('info-pacote');
  const lista = document.getElementById('lista-itens');
  if (opt.dataset.value === 'pacote') {
    lista.style.display = 'none';
    infoPacote.style.display = 'block';
  } else {
    lista.style.display = 'block';
    infoPacote.style.display = 'none';
  }
  atualizarTotal();
});

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'servico.html');
document.getElementById('btn-continuar').addEventListener('click', () => {
    sessionStorage.setItem('tipoServico', 'banho');
  const forma = formaAtual();
  let resumo, preco;

  if (forma === 'pacote') {
    resumo = `Pacote (porte ${porte})`;
    preco = 'R$ ' + precos.pacote;
  } else {
    const nomes = { banho:'Banho', banhoTosaMaquina:'Banho+Tosa Máquina', banhoTosaTesoura:'Banho+Tosa Tesoura', tosaHigienica:'Tosa Higiênica', tosaTesoura:'Tosa Tesoura', tosaMaquina:'Tosa Máquina', hidratSimples:'Hidratação Simples', hidratPremium:'Hidratação Premium' };
    resumo = [...selecionados].map(c => nomes[c]).join(' + ') || 'Nenhum item selecionado';
    preco = document.getElementById('total').textContent;
  }

  sessionStorage.setItem('servicoResumo', resumo);
  sessionStorage.setItem('servicoPreco', preco);
    let duracaoTotal = 0;
  if (forma === 'pacote') {
    duracaoTotal = duracoes.banho; // pacote usa banho simples como base de tempo
  } else {
    selecionados.forEach(chave => duracaoTotal += duracoes[chave]);
  }
  sessionStorage.setItem('duracaoMinutos', duracaoTotal);
  sessionStorage.setItem('profissionalTipo', 'banho_tosa');
  sessionStorage.removeItem('servicoResumo_direto');
  window.location.href = 'dia-hora.html';
});