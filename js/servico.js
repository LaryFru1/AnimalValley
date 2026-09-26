const petEscolhido = sessionStorage.getItem('petEscolhido') || 'seu pet';
document.getElementById('step-hint').textContent = `Passo 2 de 5 · Para ${petEscolhido}`;

function irPara(el){
  const nomeServico = el.querySelector('.name').textContent;
  sessionStorage.setItem('servicoEscolhido', nomeServico);

  if (el.dataset.tipo === 'banho') {
    window.location.href = 'banho-tosa.html';
  } else {
    window.location.href = 'dia-hora.html';
  }
}

function abrirWhatsApp(){
  window.open('https://wa.me/551132426125', '_blank');
}

document.getElementById('btn-voltar').addEventListener('click', () => window.location.href = 'escolher-pet.html');