import { supabase } from './supabase-client.js';

import { aplicarMascaraTelefone, telefoneValido, formatarTelefone } from './validacoes.js';

aplicarMascaraTelefone(document.getElementById('cfg-telefone'));

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// ---------- Funções auxiliares ----------
function formatarData(iso){
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function converterData(dataTexto){
  const [dia, mes, ano] = dataTexto.split('/');
  return `${ano}-${mes}-${dia}`;
}

function dataValida(dataTexto){
  const match = dataTexto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, dia, mes, ano] = match.map(Number);
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (ano < 1920 || ano > new Date().getFullYear()) return false;
  return true;
}

function cpfValido(cpf){
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

function hojeISO(){
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// ---------- Máscaras ----------
document.getElementById('cfg-cpf').addEventListener('input', function(){
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  this.value = v;
});

document.getElementById('cfg-nascimento').addEventListener('input', function(){
  let v = this.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  this.value = v;
});

// ---------- Preenche o formulário com os dados reais ----------
const { data: responsavel } = await supabase
  .from('responsaveis')
  .select('*')
  .eq('id', userId)
  .single();

if (responsavel) {
  document.getElementById('cfg-nome').value = responsavel.nome || '';
    document.getElementById('cfg-telefone').value = formatarTelefone(responsavel.telefone);
  document.getElementById('cfg-cpf').value = responsavel.cpf || '';
  document.getElementById('cfg-nascimento').value = formatarData(responsavel.data_nascimento);
}

// ---------- Salvar alterações ----------
document.getElementById('form-dados').addEventListener('submit', async function(e){
  e.preventDefault();

  if (!cpfValido(document.getElementById('cfg-cpf').value)) {
    alert('CPF inválido. Use o formato 000.000.000-00.');
    return;
  }
    if (!telefoneValido(document.getElementById('cfg-telefone').value)) {
    alert('Telefone inválido. Use DDD + número, por exemplo (11) 99999-9999.');
    return;
  }
  if (!dataValida(document.getElementById('cfg-nascimento').value)) {
    alert('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
    return;
  }

  const { error } = await supabase.from('responsaveis').update({
    nome: document.getElementById('cfg-nome').value,
    telefone: document.getElementById('cfg-telefone').value,
    cpf: document.getElementById('cfg-cpf').value,
    data_nascimento: converterData(document.getElementById('cfg-nascimento').value)
  }).eq('id', userId);

  if (error) {
    alert('Erro ao salvar: ' + error.message);
    return;
  }

  alert('Dados atualizados!');
});

// ---------- Navegação ----------
document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'conta.html');
document.getElementById('btn-pets').addEventListener('click', () => window.location.href = 'meus-pets.html');

document.getElementById('btn-sair').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

// ---------- Cancelar cadastro ----------
const modal = document.getElementById('modal-cancelar');
document.getElementById('btn-cancelar').addEventListener('click', () => modal.style.display = 'flex');
document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.style.display = 'none');

document.querySelectorAll('input[name="motivo"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('motivo-outro').style.display = radio.value === 'outro' && radio.checked ? 'block' : 'none';
  });
});

const btnConfirmar = document.getElementById('btn-confirmar-cancelamento');
btnConfirmar.addEventListener('click', async () => {
  const escolhido = document.querySelector('input[name="motivo"]:checked');
  if (!escolhido) {
    alert('Selecione um motivo antes de continuar.');
    return;
  }

  const textoOutro = document.getElementById('motivo-outro').value.trim();
  if (escolhido.value === 'outro' && !textoOutro) {
    alert('Conte rapidamente o motivo no campo de texto.');
    return;
  }

  const motivos = {
    'falecimento': 'Pet faleceu',
    'nao-uso': 'Não quer mais usar o app',
    'mudanca': 'Mudou de clínica',
    'outro': `Outro: ${textoOutro}`
  };

  btnConfirmar.disabled = true;

  // 1. Cancela os agendamentos futuros que ainda estavam pendentes
  await supabase
    .from('agendamentos')
    .update({ status: 'cancelado' })
    .eq('responsavel_id', userId)
    .in('status', ['aguardando', 'confirmado'])
    .gte('data', hojeISO());

  // 2. Desativa o cadastro (não apaga nada)
  const { error } = await supabase
    .from('responsaveis')
    .update({ status: 'desativado', motivo_cancelamento: motivos[escolhido.value] })
    .eq('id', userId);

  if (error) {
    alert('Erro ao cancelar o cadastro: ' + error.message);
    btnConfirmar.disabled = false;
    return;
  }

  await supabase.auth.signOut();
  alert('Seu cadastro foi desativado. Se mudar de ideia, entre em contato com a clínica.');
  window.location.href = 'index.html';
});