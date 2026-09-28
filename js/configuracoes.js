import { supabase } from './supabase-client.js';
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

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'conta.html');

// Toggle do convênio (igual ao do cadastro)
document.getElementById('toggle-convenio-cfg').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');
  document.getElementById('cfg-convenio-nome').style.display = opt.dataset.value === 'sim' ? 'block' : 'none';
});

document.getElementById('form-dados').addEventListener('submit', function(e){
  e.preventDefault();
  alert('Dados salvos! (ainda simulado — vira real quando ligarmos essa tela ao Supabase)');
});

// Modal de cancelamento
const modal = document.getElementById('modal-cancelar');
document.getElementById('btn-cancelar').addEventListener('click', () => modal.style.display = 'flex');
document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.style.display = 'none');

document.querySelectorAll('input[name="motivo"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('motivo-outro').style.display = radio.value === 'outro' && radio.checked ? 'block' : 'none';
  });
});

document.getElementById('btn-confirmar-cancelamento').addEventListener('click', () => {
  const motivo = document.querySelector('input[name="motivo"]:checked');
  if (!motivo) {
    alert('Selecione um motivo antes de continuar.');
    return;
  }
  alert('Cadastro desativado. (ainda simulado — vira real quando ligarmos ao Supabase)');
  window.location.href = 'index.html';
});
document.getElementById('btn-sair').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});