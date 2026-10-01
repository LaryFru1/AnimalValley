import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}

const NOMES_DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const duracaoMin = parseInt(sessionStorage.getItem('duracaoMinutos')) || 15;
const tipoProfissional = sessionStorage.getItem('profissionalTipo') || 'veterinaria';

function doisDigitos(n){ return String(n).padStart(2, '0'); }
function horaParaMinutos(hora){ const [h, m] = hora.split(':').map(Number); return h * 60 + m; }
function minutosParaHora(min){ return doisDigitos(Math.floor(min / 60)) + ':' + doisDigitos(min % 60); }

// Busca o profissional responsável por esse tipo de serviço
const { data: profissional, error: erroProfissional } = await supabase
  .from('profissionais')
  .select('id, nome')
  .eq('tipo', tipoProfissional)
  .eq('ativo', true)
  .limit(1)
  .single();

console.log('tipo buscado:', tipoProfissional, 'resultado:', profissional, 'erro:', erroProfissional);

if (!profissional) {
  alert('Não encontramos um profissional disponível para este serviço.');
  window.location.href = 'servico.html';
}

// Busca o expediente (todas as faixas de todos os dias) desse profissional
const { data: expediente } = await supabase
  .from('expediente')
  .select('dia_semana, hora_inicio, hora_fim')
  .eq('profissional_id', profissional.id);

// Monta os próximos 10 dias em que esse profissional trabalha
const dias = [];
const cursor = new Date();
cursor.setHours(12, 0, 0, 0);

let tentativas = 0;
while (dias.length < 8 && tentativas < 60) {
  tentativas++;
  cursor.setDate(cursor.getDate() + 1);
  const diaSemana = cursor.getDay();
  const faixasDoDia = (expediente || []).filter(e => e.dia_semana === diaSemana);
  if (faixasDoDia.length === 0) continue;

  dias.push({
    iso: `${cursor.getFullYear()}-${doisDigitos(cursor.getMonth() + 1)}-${doisDigitos(cursor.getDate())}`,
    label: NOMES_DIAS[diaSemana],
    numero: cursor.getDate(),
    faixas: faixasDoDia.map(f => [horaParaMinutos(f.hora_inicio), horaParaMinutos(f.hora_fim)])
  });
}

let diaEscolhido = dias[0];
let horaEscolhida = null;

const containerDias = document.getElementById('dias');
const containerHorarios = document.getElementById('horarios');
const btnContinuar = document.getElementById('btn-continuar');

// Calcula os horários livres de um dia específico, buscando bloqueios e agendamentos
async function calcularHorariosLivres(dia){
    const agora = new Date();
  const hojeISO = `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const { data: bloqueios } = await supabase
    .from('bloqueios')
    .select('hora_inicio, hora_fim')
    .eq('profissional_id', profissional.id)
    .eq('data', dia.iso);

  const { data: agendamentosDoDia } = await supabase
    .from('agendamentos')
    .select('horario, duracao_minutos')
    .eq('profissional_id', profissional.id)
    .eq('data', dia.iso)
    .in('status', ['aguardando', 'confirmado']);

  // Monta a lista de intervalos ocupados (em minutos desde 00:00)
  const ocupados = [];
  (bloqueios || []).forEach(b => {
    if (!b.hora_inicio) {
      ocupados.push([0, 24 * 60]); // bloqueio sem horário = dia inteiro
    } else {
      ocupados.push([horaParaMinutos(b.hora_inicio), horaParaMinutos(b.hora_fim)]);
    }
  });
  (agendamentosDoDia || []).forEach(a => {
    const inicio = horaParaMinutos(a.horario);
    ocupados.push([inicio, inicio + (a.duracao_minutos || 30)]);
  });
  ocupados.sort((a, b) => a[0] - b[0]);

  // Para cada faixa de expediente, subtrai os ocupados e sobra o que está livre
  const horariosLivres = [];
  dia.faixas.forEach(([faixaInicio, faixaFim]) => {
    let cursor = faixaInicio;
    ocupados.forEach(([ocInicio, ocFim]) => {
      if (ocFim <= faixaInicio || ocInicio >= faixaFim) return; // não toca essa faixa
      if (ocInicio > cursor) {
        gerarHorariosNoIntervalo(cursor, Math.min(ocInicio, faixaFim));
      }
      cursor = Math.max(cursor, ocFim);
    });
    if (cursor < faixaFim) {
      gerarHorariosNoIntervalo(cursor, faixaFim);
    }
  });

  function gerarHorariosNoIntervalo(inicio, fim){
    let h = inicio;
    while (h + duracaoMin <= fim) {
      horariosLivres.push(h);
      h += 15; // passo de 15 em 15 minutos
    }
  }

    if (dia.iso === hojeISO) {
    return horariosLivres.filter(minutos => minutos > minutosAgora);
  }
  return horariosLivres;
}

function renderDias(){
  containerDias.innerHTML = '';
  dias.forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-pill' + (d.iso === diaEscolhido.iso ? ' picked' : '');
    el.innerHTML = `<span class="n">${d.numero}</span>${d.label}`;
    el.addEventListener('click', async () => {
      diaEscolhido = d;
      horaEscolhida = null;
      renderDias();
      await renderHorarios();
      atualizarBotao();
    });
    containerDias.appendChild(el);
  });
}

async function renderHorarios(){
  containerHorarios.innerHTML = '';
  containerHorarios.textContent = 'Calculando horários...';

  const livres = await calcularHorariosLivres(diaEscolhido);
  containerHorarios.innerHTML = '';

  if (livres.length === 0) {
    containerHorarios.textContent = 'Nenhum horário disponível neste dia.';
    return;
  }

  livres.forEach(minutos => {
    const horaTexto = minutosParaHora(minutos);
    const el = document.createElement('div');
    el.className = 'time-slot' + (horaTexto === horaEscolhida ? ' picked' : '');
    el.textContent = horaTexto;
    el.addEventListener('click', () => {
      horaEscolhida = horaTexto;
      renderHorarios();
      atualizarBotao();
    });
    containerHorarios.appendChild(el);
  });
}

function atualizarBotao(){
  btnContinuar.disabled = !horaEscolhida;
}

renderDias();
await renderHorarios();

document.getElementById('btn-voltar').addEventListener('click', () => {
  const veioDeBanho = sessionStorage.getItem('tipoServico') === 'banho';
  window.location.href = veioDeBanho ? 'banho-tosa.html' : 'servico.html';
});

btnContinuar.addEventListener('click', () => {
  sessionStorage.setItem('dataEscolhida', diaEscolhido.iso);
  sessionStorage.setItem('horaEscolhida', horaEscolhida);
  sessionStorage.setItem('profissionalId', profissional.id);
  sessionStorage.setItem('profissionalNome', profissional.nome);
  window.location.href = 'confirmar.html';
});