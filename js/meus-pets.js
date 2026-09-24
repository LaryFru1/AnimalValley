// Dados fictícios por enquanto — depois vêm do Supabase, ligados à conta logada.
const pets = [
  { nome: 'Thor', especie: 'Cão', raca: 'Vira-lata', peso: 4.2, icone: '🐕' },
  { nome: 'Mimi', especie: 'Gato', raca: 'SRD', peso: 3.8, icone: '🐈' }
];

const container = document.getElementById('lista-pets');

pets.forEach(pet => {
  const item = document.createElement('div');
  item.className = 'pet-item';
  item.innerHTML = `
    <div class="pet-left">
      <div class="pet-ic">${pet.icone}</div>
      <div>
        <div class="pet-name">${pet.nome}</div>
        <div class="pet-meta">${pet.especie} · ${pet.raca} · ${pet.peso}kg</div>
      </div>
    </div>
  `;
  container.appendChild(item);
});

document.getElementById('btn-add-pet').addEventListener('click', function(){
  alert('Aqui depois vamos abrir a tela de adicionar um novo pet.');
});

document.getElementById('nav-home').addEventListener('click', function(){
  window.location.href = 'inicio.html';
});

document.getElementById('nav-conta').addEventListener('click', function(){
  alert('Aqui depois vamos abrir a tela "Minha conta".');
});