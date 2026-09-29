import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

const ICONES_ESPECIE = { cao: '🐕', gato: '🐈', outro: '🐾' };

const { data: responsavel } = await supabase
  .from('responsaveis')
  .select('nome')
  .eq('id', userId)
  .single();
document.getElementById('nome-usuario').textContent = responsavel ? responsavel.nome : '';

async function carregarPets(){
  const { data: pets } = await supabase
    .from('pets')
    .select('*')
    .eq('responsavel_id', userId)
    .eq('status', 'ativo')
    .order('criado_em', { ascending: true });

  const container = document.getElementById('lista-pets');
  container.innerHTML = '';

  if (!pets || pets.length === 0) {
    container.textContent = 'Você ainda não cadastrou nenhum pet.';
    return;
  }

  pets.forEach(pet => {
    const item = document.createElement('div');
    item.className = 'pet-item';

    const left = document.createElement('div');
    left.className = 'pet-left';

    const icone = document.createElement('div');
    icone.className = 'pet-ic';
    icone.textContent = ICONES_ESPECIE[pet.especie] || '🐾';

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
    item.appendChild(left);

    const acoes = document.createElement('div');
    acoes.style.display = 'flex';
    acoes.style.gap = '6px';

    const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.className = 'btn-editar';
    btnEditar.addEventListener('click', () => {
      window.location.href = `editar-pet.html?id=${pet.id}`;
    });

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = '🗑️';
    btnExcluir.className = 'btn-editar';
    btnExcluir.style.color = '#E5346E';
    btnExcluir.addEventListener('click', () => arquivarPet(pet));

    acoes.appendChild(btnEditar);
    acoes.appendChild(btnExcluir);
    item.appendChild(acoes);

    container.appendChild(item);
  });
}

async function arquivarPet(pet){
  const confirmado = confirm(
    `Remover ${pet.nome} da sua lista?\n\nEle não será apagado — o histórico continua guardado, e a clínica pode reativar o cadastro dele se você pedir.`
  );
  if (!confirmado) return;

  const { error } = await supabase
    .from('pets')
    .update({ status: 'arquivado' })
    .eq('id', pet.id);

  if (error) {
    alert('Não foi possível remover: ' + error.message);
    return;
  }

  carregarPets();
}

carregarPets();

document.getElementById('btn-add-pet').addEventListener('click', () => window.location.href = 'adicionar-pet.html');
document.getElementById('nav-home').addEventListener('click', () => window.location.href = 'inicio.html');
document.getElementById('nav-conta').addEventListener('click', () => window.location.href = 'conta.html');