import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// Máscara e validação da data
document.getElementById('pet-nascimento').addEventListener('input', function(){
  let v = this.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
  else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
  this.value = v;
});

function dataValida(dataTexto){
  const match = dataTexto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, dia, mes, ano] = match.map(Number);
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (ano < 2000 || ano > new Date().getFullYear()) return false;
  return true;
}

function converterData(dataTexto){
  const [dia, mes, ano] = dataTexto.split('/');
  return `${ano}-${mes}-${dia}`;
}

// Toggle castrado
document.getElementById('toggle-castrado').addEventListener('click', function(e){
  const opt = e.target.closest('.toggle-opt');
  if (!opt) return;
  this.querySelectorAll('.toggle-opt').forEach(o => o.classList.remove('picked'));
  opt.classList.add('picked');
});

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'meus-pets.html');

// Salvar
document.getElementById('pet-form').addEventListener('submit', async function(e){
  e.preventDefault();

  if (!dataValida(document.getElementById('pet-nascimento').value)) {
    alert('Data de nascimento inválida. Use o formato dd/mm/aaaa.');
    return;
  }

  const castrado = document.querySelector('#toggle-castrado .toggle-opt.picked').dataset.value === 'sim';

    let fotoUrl = null;
  const arquivoFoto = document.getElementById('pet-foto').files[0];
  if (arquivoFoto) {
    const caminhoFoto = `${userId}/${Date.now()}-${arquivoFoto.name}`;
    const { error: erroFoto } = await supabase.storage.from('fotos-pets').upload(caminhoFoto, arquivoFoto);
    if (!erroFoto) {
      const { data: urlPublica } = supabase.storage.from('fotos-pets').getPublicUrl(caminhoFoto);
      fotoUrl = urlPublica.publicUrl;
    }
  }
  const { error } = await supabase.from('pets').insert({
    foto_url: fotoUrl,
    responsavel_id: userId,
    nome: document.getElementById('pet-nome').value,
    especie: document.getElementById('pet-especie').value,
    raca: document.getElementById('pet-raca').value,
    sexo: document.getElementById('pet-sexo').value,
    microchip: document.getElementById('pet-microchip').value || null,
    peso: parseFloat(document.getElementById('pet-peso').value),
    data_nascimento: converterData(document.getElementById('pet-nascimento').value),
    castrado: castrado
  });

  if (error) {
    alert('Erro ao salvar o pet: ' + error.message);
    return;
  }

  window.location.href = 'meus-pets.html';
});