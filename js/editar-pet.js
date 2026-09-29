import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}

// Descobre qual pet está sendo editado, pelo id na URL (ex: editar-pet.html?id=abc123)
const petId = new URLSearchParams(window.location.search).get('id');
if (!petId) {
  window.location.href = 'meus-pets.html';
}

const { data: pet, error: erroCarregar } = await supabase
  .from('pets')
  .select('*')
  .eq('id', petId)
  .single();

if (erroCarregar || !pet) {
  alert('Não foi possível carregar este pet.');
  window.location.href = 'meus-pets.html';
}

// Converte 2024-10-06 em 06/10/2024 para mostrar na tela
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
  if (ano < 2000 || ano > new Date().getFullYear()) return false;
  return true;
}

// Preenche o formulário com os dados atuais do pet
document.getElementById('pet-nome').value = pet.nome || '';
document.getElementById('pet-especie').value = pet.especie || '';
document.getElementById('pet-raca').value = pet.raca || '';
document.getElementById('pet-sexo').value = pet.sexo || '';
document.getElementById('pet-microchip').value = pet.microchip || '';
document.getElementById('pet-peso').value = pet.peso || '';
document.getElementById('pet-nascimento').value = formatarData(pet.data_nascimento);

function marcarToggle(idToggle, valor){
  document.querySelectorAll(`#${idToggle} .toggle-opt`).forEach(o => {
    o.classList.toggle('picked', o.dataset.value === valor);
  });
}

marcarToggle('toggle-castrado', pet.castrado ? 'sim' : 'nao');

const temConvenio = !!pet.convenio_nome;
marcarToggle('toggle-convenio', temConvenio ? 'sim' : 'nao');
const campoConvenio = document.getElementById('pet-convenio-nome');
campoConvenio.value = pet.convenio_nome || '';
campoConvenio.style.display = temConvenio ? 'block' : 'none';

// Máscara da data
document.getElementById('pet-nascimento').addEventListener('input', function(){
  let v = this.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  this.value = v;
});

// Cliques nos toggles
document.getElementById('toggle-castrado').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  marcarToggle('toggle-castrado', opt.dataset.value);
});

document.getElementById('toggle-convenio').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  marcarToggle('toggle-convenio', opt.dataset.value);
  campoConvenio.style.display = opt.dataset.value === 'sim' ? 'block' : 'none';
});

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'meus-pets.html');

// Salvar as alterações
document.getElementById('pet-form').addEventListener('submit', async function(e){
  e.preventDefault();

  if (!dataValida(document.getElementById('pet-nascimento').value)) {
    alert('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
    return;
  }

  const castrado = document.querySelector('#toggle-castrado .toggle-opt.picked').dataset.value === 'sim';
  const convenioSim = document.querySelector('#toggle-convenio .toggle-opt.picked').dataset.value === 'sim';

  const { error } = await supabase.from('pets').update({
    nome: document.getElementById('pet-nome').value,
    especie: document.getElementById('pet-especie').value,
    raca: document.getElementById('pet-raca').value,
    sexo: document.getElementById('pet-sexo').value,
    microchip: document.getElementById('pet-microchip').value || null,
    peso: parseFloat(document.getElementById('pet-peso').value),
    data_nascimento: converterData(document.getElementById('pet-nascimento').value),
    castrado: castrado,
    convenio_nome: convenioSim ? document.getElementById('pet-convenio-nome').value : null
  }).eq('id', petId);

  if (error) {
    alert('Erro ao salvar: ' + error.message);
    return;
  }

  window.location.href = 'meus-pets.html';
});