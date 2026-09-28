import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

const { data: pets } = await supabase
  .from('pets')
  .select('*')
  .eq('responsavel_id', userId)
  .order('criado_em', { ascending: true });

const container = document.getElementById('lista-pets');
const btnContinuar = document.getElementById('btn-continuar');
let petSelecionado = pets && pets.length > 0 ? pets[0] : null;

function render(){
  container.innerHTML = '';

  if (!pets || pets.length === 0) {
    container.textContent = 'Você ainda não cadastrou nenhum pet.';
    btnContinuar.disabled = true;
    return;
  }

  pets.forEach(pet => {
    const item = document.createElement('div');
    item.className = 'pet-item' + (petSelecionado && pet.id === petSelecionado.id ? ' picked' : '');

    const left = document.createElement('div');
    left.className = 'pet-left';

    const icone = document.createElement('div');
    icone.className = 'pet-ic';
    icone.textContent = '🐾';

    const info = document.createElement('div');
    const nome = document.createElement('div');
    nome.className = 'pet-name';
    nome.textContent = pet.nome;
    const meta = document.createElement('div');
    meta.className = 'pet-meta';
    meta.textContent = `${pet.raca || 'Sem raça informada'} · ${pet.peso} kg`;
    info.appendChild(nome);
    info.appendChild(meta);

    left.appendChild(icone);
    left.appendChild(info);

    const check = document.createElement('div');
    check.className = 'pet-check';

    item.appendChild(left);
    item.appendChild(check);

    item.addEventListener('click', () => {
      petSelecionado = pet;
      render();
    });

    container.appendChild(item);
  });

  btnContinuar.disabled = false;
}
render();

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'inicio.html');
document.getElementById('btn-add-pet').addEventListener('click', () => window.location.href = 'adicionar-pet.html');

btnContinuar.addEventListener('click', () => {
  sessionStorage.setItem('petEscolhido', petSelecionado.nome);
  sessionStorage.setItem('petPeso', petSelecionado.peso);
  sessionStorage.setItem('petId', petSelecionado.id);
  window.location.href = 'servico.html';
});