const petEscolhido = sessionStorage.getItem('petEscolhido') || 'seu pet';
document.getElementById('step-hint').textContent = `Passo 2 de 5 · Para ${petEscolhido}`;

function irPara(el){
    const DURACAO_SERVICO = {
    'Consulta veterinária': 30,
    'Vacinas': 15,
    'Exames de sangue / coletas': 15,
    'Eletrocardiograma': 15,
    'Pressão arterial': 15,
    'Curativo': 15,
    'Fluidoterapia': 15,
    'Atestado de viagem nacional': 15,
    'Aplicações de medicações': 15
  };
  const nomeServico = el.querySelector('.name').textContent;
  const precoTexto = el.querySelector('.meta').textContent;
  sessionStorage.setItem('servicoResumo', nomeServico);
  sessionStorage.setItem('tipoServico', el.dataset.tipo === 'banho' ? 'banho' : 'direto');
  sessionStorage.setItem('servicoPreco', precoTexto);
    sessionStorage.setItem('duracaoMinutos', DURACAO_SERVICO[nomeServico] || 15);
  sessionStorage.setItem('profissionalTipo', 'veterinaria');
  sessionStorage.removeItem('banhoTosaResumo'); // limpa resíduo de uma escolha anterior

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