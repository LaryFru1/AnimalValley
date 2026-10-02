import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}

const PRECOS_PACOTE = { P: 200, M: 230, G: 305, GG: 445 };
const PRECOS = {
  P:  { banho:65,  tosaHigienica:20, tosaTesoura:70,  tosaMaquina:45,  hidratSimples:15, hidratPremium:25 },
  M:  { banho:75,  tosaHigienica:30, tosaTesoura:90,  tosaMaquina:55,  hidratSimples:20, hidratPremium:30 },
  G:  { banho:100, tosaHigienica:40, tosaTesoura:120, tosaMaquina:70,  hidratSimples:30, hidratPremium:40 },
  GG: { banho:150, tosaHigienica:50, tosaTesoura:150, tosaMaquina:100, hidratSimples:40, hidratPremium:50 }
};

const DURACOES = {
  P:  { banho:45,  tosaHigienica:10, tosaTesoura:90,  tosaMaquina:60,  hidratSimples:10, hidratPremium:10 },
  M:  { banho:60,  tosaHigienica:10, tosaTesoura:120, tosaMaquina:90,  hidratSimples:10, hidratPremium:10 },
  G:  { banho:90,  tosaHigienica:10, tosaTesoura:150, tosaMaquina:120, hidratSimples:10, hidratPremium:10 },
  GG: { banho:120, tosaHigienica:10, tosaTesoura:180, tosaMaquina:150, hidratSimples:10, hidratPremium:10 }
};

const NOMES = { banho:'Banho', tosaHigienica:'Tosa Higiênica', tosaTesoura:'Tosa Tesoura', tosaMaquina:'Tosa Máquina', hidratSimples:'Hidratação Simples', hidratPremium:'Hidratação Premium' };

function calcularPorte(peso){
  if (peso <= 10) return 'P';
  if (peso <= 20) return 'M';
  if (peso <= 30) return 'G';
  return 'GG';
}

const nomePet = sessionStorage.getItem('petEscolhido') || 'seu pet';
const petId = sessionStorage.getItem('petId');
const peso = parseFloat(sessionStorage.getItem('petPeso')) || 5;
const porte = calcularPorte(peso);
const precos = PRECOS[porte];
const duracoes = DURACOES[porte];

document.getElementById('titulo').textContent = `Banho e tosa — ${nomePet} (porte ${porte})`;

// Busca se o pet já tem um pacote ativo
const { data: pacoteAtivo } = await supabase
  .from('pacotes')
  .select('*')
  .eq('pet_id', petId)
  .eq('status', 'ativo')
  .order('criado_em', { ascending: false })
  .limit(1)
  .maybeSingle();

const sessoesRestantes = pacoteAtivo ? (pacoteAtivo.sessoes_total - pacoteAtivo.sessoes_usadas) : 4;
const tosaHigienicaDisponivel = pacoteAtivo ? !pacoteAtivo.tosa_higienica_usada : true;

let formaAtual = 'avulso';
const selecionadosAvulso = new Set();
const extrasPacote = new Set();
let tosaHigienicaIncluidaMarcada = tosaHigienicaDisponivel;

function atualizarBanner(){
  const banner = document.getElementById('banner-pacote');
  if (formaAtual !== 'pacote') { banner.style.display = 'none'; return; }
  banner.style.display = 'block';
  banner.className = 'pkg-card';

  if (!pacoteAtivo) {
    banner.innerHTML = `
      <div class="pkg-name">Novo pacote — porte ${porte}</div>
      <div class="pkg-meta">Inclui 4 banhos + 1 tosa higiênica · válido por 1 mês</div>
      <div class="pkg-meta" style="font-weight:700;color:var(--teal-900);margin-top:4px">Valor do pacote: R$ ${PRECOS_PACOTE[porte]}</div>
      <div class="banner-note" style="margin-top:10px">Você ainda não tem um pacote ativo para ${nomePet}. Ao confirmar este agendamento, esse pacote será iniciado, e o valor cobrado presencialmente, neste primeiro atendimento.</div>
    `;
  } else if (sessoesRestantes <= 0) {
    banner.innerHTML = `<div class="banner-note">O pacote de ${nomePet} já foi totalmente utilizado. Escolha "Avulso" ou entre em contato com a clínica para renovar.</div>`;
  } else {
    banner.innerHTML = `
      <div class="pkg-name">Pacote ativo — porte ${porte}</div>
      <div class="pkg-meta">${pacoteAtivo.sessoes_usadas} de ${pacoteAtivo.sessoes_total} banhos usados · válido até ${pacoteAtivo.validade.split('-').reverse().join('/')}</div>
    `;
  }
}

function renderItens(){
  const container = document.getElementById('lista-itens');
  container.innerHTML = '';

  if (formaAtual === 'avulso') {
    Object.keys(precos).forEach(chave => {
      const div = document.createElement('div');
      div.className = 'svc-item' + (selecionadosAvulso.has(chave) ? ' picked' : '');
      div.innerHTML = `<div><div class="name">${NOMES[chave]}</div><div class="meta">porte ${porte}</div></div><div style="display:flex;align-items:center;gap:8px"><span class="price">R$ ${precos[chave]}</span><div class="check-sq"></div></div>`;
      div.addEventListener('click', () => {
        if (selecionadosAvulso.has(chave)) selecionadosAvulso.delete(chave);
        else selecionadosAvulso.add(chave);
        renderItens();
      });
      container.appendChild(div);
    });
  } else {
    // Banho sempre incluso, travado
    const divBanho = document.createElement('div');
    divBanho.className = 'svc-item picked';
    divBanho.style.opacity = '0.85';
    divBanho.innerHTML = `<div><div class="name">Banho</div><div class="meta">porte ${porte}</div></div><span class="price">Incluso</span>`;
    container.appendChild(divBanho);

    // Tosa higiênica: incluso se disponível, senão vira extra pago
    const divTosaH = document.createElement('div');
    if (tosaHigienicaDisponivel) {
      divTosaH.className = 'svc-item' + (tosaHigienicaIncluidaMarcada ? ' picked' : '');
      divTosaH.innerHTML = `<div><div class="name">Tosa Higiênica</div><div class="meta">1 por mês, incluída no pacote</div></div><div style="display:flex;align-items:center;gap:8px"><span class="price">${tosaHigienicaIncluidaMarcada ? 'Incluso' : 'Não incluir'}</span><div class="check-sq"></div></div>`;
      divTosaH.addEventListener('click', () => { tosaHigienicaIncluidaMarcada = !tosaHigienicaIncluidaMarcada; renderItens(); });
    } else {
      divTosaH.className = 'svc-item' + (extrasPacote.has('tosaHigienica') ? ' picked' : '');
      divTosaH.innerHTML = `<div><div class="name">Tosa Higiênica</div><div class="meta">já usada este mês · cobrada à parte</div></div><div style="display:flex;align-items:center;gap:8px"><span class="price">R$ ${precos.tosaHigienica}</span><div class="check-sq"></div></div>`;
      divTosaH.addEventListener('click', () => {
        if (extrasPacote.has('tosaHigienica')) extrasPacote.delete('tosaHigienica'); else extrasPacote.add('tosaHigienica');
        renderItens();
      });
    }
    container.appendChild(divTosaH);

    // Extras sempre pagos: tosa tesoura, tosa máquina, hidratações
    ['tosaTesoura','tosaMaquina','hidratSimples','hidratPremium'].forEach(chave => {
      const div = document.createElement('div');
      div.className = 'svc-item' + (extrasPacote.has(chave) ? ' picked' : '');
      div.innerHTML = `<div><div class="name">${NOMES[chave]}</div><div class="meta">extra, cobrado à parte</div></div><div style="display:flex;align-items:center;gap:8px"><span class="price">R$ ${precos[chave]}</span><div class="check-sq"></div></div>`;
      div.addEventListener('click', () => {
        if (extrasPacote.has(chave)) extrasPacote.delete(chave); else extrasPacote.add(chave);
        renderItens();
      });
      container.appendChild(div);
    });
  }

  atualizarTotal();
}

function atualizarTotal(){
  const totalEl = document.getElementById('total');
  const label = document.getElementById('total-label');

  if (formaAtual === 'avulso') {
    label.textContent = 'Total selecionado';
    let total = 0;
    selecionadosAvulso.forEach(c => total += precos[c]);
    totalEl.textContent = 'R$ ' + total;
  } else {
    let totalExtras = 0;
    extrasPacote.forEach(c => totalExtras += precos[c]);

    if (!pacoteAtivo) {
      label.textContent = 'Total a pagar no primeiro agendamento';
      totalEl.textContent = 'R$ ' + (PRECOS_PACOTE[porte] + totalExtras);
    } else {
      label.textContent = 'Total extra (fora do pacote)';
      totalEl.textContent = totalExtras > 0 ? 'R$ ' + totalExtras : 'R$ 0 (só o pacote)';
    }
  }
}

document.getElementById('toggle-forma').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;

  if (opt.dataset.value === 'pacote' && pacoteAtivo && sessoesRestantes <= 0) {
    alert('Este pacote já foi totalmente utilizado.');
    return;
  }

  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');
  formaAtual = opt.dataset.value;
  atualizarBanner();
  renderItens();
});

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'servico.html');

document.getElementById('btn-continuar').addEventListener('click', () => {
  let resumoPartes = [];
  let precoExtra = 0;
  let duracaoTotal = 0;

  if (formaAtual === 'avulso') {
    if (selecionadosAvulso.size === 0) { alert('Escolha pelo menos um item.'); return; }
    selecionadosAvulso.forEach(c => {
      resumoPartes.push(NOMES[c]);
      precoExtra += precos[c];
      duracaoTotal += duracoes[c];
    });
  } else {
    resumoPartes.push('Banho (pacote)');
    duracaoTotal += duracoes.banho;
    if (tosaHigienicaDisponivel && tosaHigienicaIncluidaMarcada) {
      resumoPartes.push('Tosa Higiênica (pacote)');
      duracaoTotal += duracoes.tosaHigienica;
    }
    extrasPacote.forEach(c => {
      resumoPartes.push(NOMES[c] + ' (extra)');
      precoExtra += precos[c];
      duracaoTotal += duracoes[c];
    });
  }

  sessionStorage.setItem('servicoResumo', resumoPartes.join(' + '));
  sessionStorage.setItem('servicoPreco', 'R$ ' + precoExtra);
  sessionStorage.setItem('duracaoMinutos', duracaoTotal);
  sessionStorage.setItem('profissionalTipo', 'banho_tosa');
  sessionStorage.setItem('tipoServico', 'banho');
  sessionStorage.setItem('usaPacote', formaAtual === 'pacote' ? 'sim' : 'nao');
  sessionStorage.setItem('tosaHigienicaIncluida', (formaAtual === 'pacote' && tosaHigienicaDisponivel && tosaHigienicaIncluidaMarcada) ? 'sim' : 'nao');
  sessionStorage.setItem('porteSelecionado', porte);
  sessionStorage.setItem('pacoteIdExistente', pacoteAtivo ? pacoteAtivo.id : '');

  window.location.href = 'dia-hora.html';
});

atualizarBanner();
renderItens();