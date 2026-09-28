import { supabase } from './supabase-client.js';

// Verifica login
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// Nome do responsável, no topo
const { data: responsavel } = await supabase
  .from('responsaveis')
  .select('nome')
  .eq('id', userId)
  .single();
document.getElementById('nome-usuario').textContent = responsavel ? responsavel.nome : '';

// Pets reais
const { data: pets } = await supabase
  .from('pets')
  .select('*')
  .eq('responsavel_id', userId)
  .order('criado_em', { ascending: true });

const container = document.getElementById('lista-pets');
container.innerHTML = '';

if (!pets || pets.length === 0) {
  container.textContent = 'Você ainda não cadastrou nenhum pet.';
} else {
  pets.forEach(pet => {
    const item = document.createElement('div');
    item.className = 'pet-item';

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
    item.appendChild(left);
        const btnEditar = document.createElement('button');
    btnEditar.textContent = '✏️ Editar';
    btnEditar.className = 'btn-editar';
    btnEditar.addEventListener('click', () => {
      window.location.href = `editar-pet.html?id=${pet.id}`;
    });
    item.appendChild(btnEditar);
    container.appendChild(item);
  });
}

// Navegação
document.getElementById('btn-add-pet').addEventListener('click', () => window.location.href = 'adicionar-pet.html');
document.getElementById('nav-home').addEventListener('click', () => window.location.href = 'inicio.html');
document.getElementById('nav-conta').addEventListener('click', () => window.location.href = 'conta.html');