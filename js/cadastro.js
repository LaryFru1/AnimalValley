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

function aplicarMascaraData(input){
  input.addEventListener('input', function(){
    let v = this.value.replace(/\D/g, '').slice(0, 8); // só números, no máximo 8 dígitos
    if (v.length >= 5) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
    else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
    this.value = v;
  });
}

aplicarMascaraData(document.getElementById('su-nascimento'));
aplicarMascaraData(document.getElementById('pet-nascimento'));

function dataValida(dataTexto){
  const match = dataTexto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, dia, mes, ano] = match.map(Number);
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (ano < 1920 || ano > new Date().getFullYear()) return false;
  return true;
}



// Máscara + validação simples de CPF
const campoCpf = document.getElementById('su-cpf');
campoCpf.addEventListener('input', function(){
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  this.value = v;
});

function cpfValido(cpf){
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

document.getElementById('signup-form').addEventListener('submit', function(e){
  e.preventDefault();
  if (!cpfValido(document.getElementById('su-cpf').value)) {
  alert('CPF inválido. Use o formato 000.000.000-00.');
  return;
}
if (!dataValida(document.getElementById('su-nascimento').value)) {
  alert('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
  return;
}
if (!dataValida(document.getElementById('pet-nascimento').value)) {
  alert('Data de nascimento do pet inválida. Use o formato dd/mm/aaaa.');
  return;
}

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