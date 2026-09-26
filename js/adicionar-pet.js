document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'meus-pets.html');

document.getElementById('toggle-castrado').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');
});

document.getElementById('pet-form').addEventListener('submit', function(e){
  e.preventDefault();
  console.log('Novo pet (ainda local, sem salvar de verdade)');
  window.location.href = 'meus-pets.html';
});