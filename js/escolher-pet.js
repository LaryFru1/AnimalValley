const pets = [
  { nome: 'Thor', raca: 'Vira-lata', peso: 4.2, icone: '🐕' },
  { nome: 'Mimi', raca: 'SRD', peso: 3.8, icone: '🐈' },
  { nome: 'Teste M', raca: 'Teste', peso: 15, icone: '🐕' },
  { nome: 'Teste G', raca: 'Teste', peso: 25, icone: '🐕' },
  { nome: 'Teste GG', raca: 'Teste', peso: 35, icone: '🐕' }
];

const container = document.getElementById('lista-pets');
let petSelecionado = pets[0].nome;

function render(){
  container.innerHTML = '';
  pets.forEach(pet => {
    const item = document.createElement('div');
    item.className = 'pet-item' + (pet.nome === petSelecionado ? ' picked' : '');
    item.innerHTML = `
      <div class="pet-left">
        <div class="pet-ic">${pet.icone}</div>
        <div>
          <div class="pet-name">${pet.nome}</div>
          <div class="pet-meta">${pet.raca} · ${pet.peso}kg</div>
        </div>
      </div>
      <div class="pet-check"></div>
    `;
    item.addEventListener('click', () => { petSelecionado = pet.nome; render(); });
    container.appendChild(item);
  });
  document.getElementById('btn-continuar').disabled = false;
}
render();

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'inicio.html');
document.getElementById('btn-add-pet').addEventListener('click', () => window.location.href = 'adicionar-pet.html');
document.getElementById('btn-continuar').addEventListener('click', () => {
  // Guardamos qual pet foi escolhido pra próxima tela usar (fake por enquanto)
  const petObj = pets.find(p => p.nome === petSelecionado);
sessionStorage.setItem('petEscolhido', petObj.nome);
sessionStorage.setItem('petPeso', petObj.peso);
  window.location.href = 'servico.html';
});