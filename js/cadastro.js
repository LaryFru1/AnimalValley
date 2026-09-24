document.getElementById('signup-form').addEventListener('submit', function(e){
  e.preventDefault();

  const dados = {
    nome: document.getElementById('su-nome').value,
    telefone: document.getElementById('su-telefone').value,
    senha: document.getElementById('su-senha').value,
    pet: {
      nome: document.getElementById('pet-nome').value,
      especie: document.getElementById('pet-especie').value,
      raca: document.getElementById('pet-raca').value,
      peso: document.getElementById('pet-peso').value
    }
  };

  console.log('Cadastro (ainda local, sem salvar de verdade):', dados);
  alert('Cadastro preenchido! Quando ligarmos o Supabase, isso vai ser salvo de verdade.');
});