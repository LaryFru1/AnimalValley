// Toggle: convênio
document.getElementById('toggle-convenio').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');

  const campoConvenio = document.getElementById('pet-convenio-nome');
  campoConvenio.style.display = (opt.dataset.value === 'sim') ? 'block' : 'none';
});

// Toggle: castrado
document.getElementById('toggle-castrado').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');
});

document.getElementById('signup-form').addEventListener('submit', function(e){
  e.preventDefault();

  const temConvenio = document.querySelector('#toggle-convenio .toggle-opt.picked').dataset.value === 'sim';
  const castrado = document.querySelector('#toggle-castrado .toggle-opt.picked').dataset.value === 'sim';

  const dados = {
    responsavel: {
      nome: document.getElementById('su-nome').value,
      telefone: document.getElementById('su-telefone').value,
      senha: document.getElementById('su-senha').value,
      cpf: document.getElementById('su-cpf').value,
      nascimento: document.getElementById('su-nascimento').value
    },
    pet: {
      nome: document.getElementById('pet-nome').value,
      raca: document.getElementById('pet-raca').value,
      sexo: document.getElementById('pet-sexo').value,
      microchip: document.getElementById('pet-microchip').value,
      peso: document.getElementById('pet-peso').value,
      nascimento: document.getElementById('pet-nascimento').value,
      castrado: castrado,
      convenio: temConvenio ? document.getElementById('pet-convenio-nome').value : null,
      foto: document.getElementById('pet-foto').files[0] || null
    }
  };

  console.log('Cadastro (ainda local, sem salvar de verdade):', dados);
  window.location.href = 'inicio.html';
});