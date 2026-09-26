// Dados fictícios por enquanto — depois vêm do painel da recepção, via Supabase.
const dias = [
  { label: 'Ter', numero: 22 },
  { label: 'Qua', numero: 23 },
  { label: 'Qui', numero: 24 },
  { label: 'Sex', numero: 25 },
  { label: 'Sáb', numero: 26 }
];

const horariosPorDia = {
  22: ['09:00','10:00','11:00','14:00','15:00'],
  23: ['09:00','09:30f','10:00','10:30','11:30','13:00f','14:00','15:30','16:00'],
  24: ['09:00','10:00','13:00','14:00','16:00'],
  25: ['09:30','10:30','11:00','14:00'],
  26: ['09:00','09:30','10:00']
};

let diaEscolhido = dias[1].numero; // Qua vem pré-selecionada, só de exemplo
let horaEscolhida = null;

const containerDias = document.getElementById('dias');
const containerHorarios = document.getElementById('horarios');
const btnContinuar = document.getElementById('btn-continuar');

function renderDias(){
  containerDias.innerHTML = '';
  dias.forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-pill' + (d.numero === diaEscolhido ? ' picked' : '');
    el.innerHTML = `<span class="n">${d.numero}</span>${d.label}`;
    el.addEventListener('click', () => {
      diaEscolhido = d.numero;
      horaEscolhida = null;
      renderDias();
      renderHorarios();
      atualizarBotao();
    });
    containerDias.appendChild(el);
  });
}

function renderHorarios(){
  containerHorarios.innerHTML = '';
  (horariosPorDia[diaEscolhido] || []).forEach(h => {
    const cheio = h.endsWith('f');
    const hora = cheio ? h.slice(0, -1) : h;
    const el = document.createElement('div');
    el.className = 'time-slot' + (cheio ? ' full' : '') + (hora === horaEscolhida ? ' picked' : '');
    el.textContent = hora;
    if (!cheio) {
      el.addEventListener('click', () => {
        horaEscolhida = hora;
        renderHorarios();
        atualizarBotao();
      });
    }
    containerHorarios.appendChild(el);
  });
}

function atualizarBotao(){
  btnContinuar.disabled = !horaEscolhida;
}

renderDias();
renderHorarios();

document.getElementById('btn-voltar').addEventListener('click', () => {
  const veioDeBanho = sessionStorage.getItem('banhoTosaEscolhidos');
  window.location.href = veioDeBanho ? 'banho-tosa.html' : 'servico.html';
});

btnContinuar.addEventListener('click', () => {
  sessionStorage.setItem('diaEscolhido', diaEscolhido);
  sessionStorage.setItem('horaEscolhida', horaEscolhida);
  window.location.href = 'confirmar.html';
});