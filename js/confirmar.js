if (sessionStorage.getItem('tipoServico') === 'banho') {
  document.getElementById('bloco-pagamento').style.display = 'none';
}

document.getElementById('r-pet').textContent = sessionStorage.getItem('petEscolhido') || '—';
document.getElementById('r-servico').textContent = sessionStorage.getItem('servicoResumo') || '—';
document.getElementById('r-dia').textContent = 'Dia ' + (sessionStorage.getItem('diaEscolhido') || '—');
document.getElementById('r-hora').textContent = sessionStorage.getItem('horaEscolhida') || '—';
document.getElementById('r-valor').textContent = sessionStorage.getItem('servicoPreco') || '—';

document.getElementById('toggle-pagamento').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');

  const usaConvenio = opt.dataset.value === 'convenio';
  document.getElementById('linha-valor').style.display = usaConvenio ? 'none' : 'flex';
  document.getElementById('nota-particular').style.display = usaConvenio ? 'none' : 'block';
  document.getElementById('nota-convenio').style.display = usaConvenio ? 'block' : 'none';
});

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'dia-hora.html');

document.getElementById('btn-enviar').addEventListener('click', () => {
  alert('Pré-agendamento enviado! (ainda simulado — vai virar real quando ligarmos o Supabase)');
  window.location.href = 'inicio.html';
});