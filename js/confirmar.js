import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// Dados guardados nas telas anteriores
const petId = sessionStorage.getItem('petId');
const petNome = sessionStorage.getItem('petEscolhido');
const servico = sessionStorage.getItem('servicoResumo');
const precoTexto = sessionStorage.getItem('servicoPreco') || '';
const dataISO = sessionStorage.getItem('dataEscolhida');
const hora = sessionStorage.getItem('horaEscolhida');
const tipoServico = sessionStorage.getItem('tipoServico');

// Se faltar algo do caminho, recomeça
if (!petId || !servico || servico === 'Nenhum item selecionado' || !dataISO || !hora) {
  alert('Faltam informações do agendamento. Vamos recomeçar.');
  window.location.href = 'escolher-pet.html';
}

// Monta o resumo na tela
const NOMES_DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const [ano, mes, dia] = dataISO.split('-');
const diaSemana = NOMES_DIAS[new Date(dataISO + 'T12:00:00').getDay()];

document.getElementById('r-pet').textContent = petNome || '—';
document.getElementById('r-servico').textContent = servico;
document.getElementById('r-dia').textContent = `${diaSemana}, ${dia}/${mes}`;
document.getElementById('r-hora').textContent = hora;
document.getElementById('r-valor').textContent = precoTexto || '—';

// Banho e tosa não usa convênio
if (tipoServico === 'banho') {
  document.getElementById('bloco-pagamento').style.display = 'none';
}

let formaPagamento = 'particular';

document.getElementById('toggle-pagamento').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');

  formaPagamento = opt.dataset.value;
  const usaConvenio = formaPagamento === 'convenio';
  document.getElementById('linha-valor').style.display = usaConvenio ? 'none' : 'flex';
  document.getElementById('nota-particular').style.display = usaConvenio ? 'none' : 'block';
  document.getElementById('nota-convenio').style.display = usaConvenio ? 'block' : 'none';
});

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'dia-hora.html');

// Transforma "a partir de R$ 180" em 180 (ou vazio, se não tiver valor)
function extrairValor(texto){
  const m = texto.match(/R\$\s*(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

// Envia o pré-agendamento
const btnEnviar = document.getElementById('btn-enviar');
btnEnviar.addEventListener('click', async () => {
  btnEnviar.disabled = true;
  btnEnviar.textContent = 'Enviando...';

  const usaConvenio = formaPagamento === 'convenio';
  const usaPacote = servico.startsWith('Pacote');

  const { error } = await supabase.from('agendamentos').insert({
    pet_id: petId,
    responsavel_id: userId,
    servico: servico,
    detalhes: usaPacote ? 'Usar pacote' : null,
    data: dataISO,
    horario: hora,
    forma_pagamento: formaPagamento,
    valor_estimado: usaConvenio ? null : extrairValor(precoTexto)
  });

  if (error) {
    alert('Erro ao enviar o pré-agendamento: ' + error.message);
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar pré-agendamento';
    return;
  }

  // Limpa os dados temporários do caminho de agendamento
  ['petId','petEscolhido','petPeso','servicoResumo','servicoPreco','dataEscolhida','horaEscolhida','tipoServico']
    .forEach(chave => sessionStorage.removeItem(chave));

  alert('Pré-agendamento enviado! A clínica vai confirmar em breve.');
  window.location.href = 'conta.html';
});