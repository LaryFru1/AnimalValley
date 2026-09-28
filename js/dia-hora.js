// Horários de exemplo (ainda fictícios). Depois vêm do painel da recepção,
// respeitando o horário da clínica: seg a sex 8h–17h, sábado 9h–13h.
const NOMES_DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const HORARIOS_SEMANA = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
const HORARIOS_SABADO = ['09:00','10:00','11:00','12:00'];

function doisDigitos(n){ return String(n).padStart(2, '0'); }

// Gera os próximos 6 dias em que a clínica abre (a partir de amanhã, sem domingos)
const dias = [];
const cursor = new Date();
cursor.setHours(12, 0, 0, 0);

while (dias.length < 6) {
  cursor.setDate(cursor.getDate() + 1);
  const diaSemana = cursor.getDay();
  if (diaSemana === 0) continue;

  const lista = diaSemana === 6 ? HORARIOS_SABADO : HORARIOS_SEMANA;
  const horarios = lista.map((hora, i) => ({
    hora: hora,
    cheio: (cursor.getDate() + i) % 5 === 0  // só para simular alguns horários ocupados
  }));

  dias.push({
    iso: `${cursor.getFullYear()}-${doisDigitos(cursor.getMonth() + 1)}-${doisDigitos(cursor.getDate())}`,
    label: NOMES_DIAS[diaSemana],
    numero: cursor.getDate(),
    horarios: horarios
  });
}

let diaEscolhido = dias[0];
let horaEscolhida = null;

const containerDias = document.getElementById('dias');
const containerHorarios = document.getElementById('horarios');
const btnContinuar = document.getElementById('btn-continuar');

function renderDias(){
  containerDias.innerHTML = '';
  dias.forEach(d => {
    const el = document.createElement('div');
    el.className = 'day-pill' + (d.iso === diaEscolhido.iso ? ' picked' : '');
    el.innerHTML = `<span class="n">${d.numero}</span>${d.label}`;
    el.addEventListener('click', () => {
      diaEscolhido = d;
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
  diaEscolhido.horarios.forEach(h => {
    const el = document.createElement('div');
    el.className = 'time-slot' + (h.cheio ? ' full' : '') + (h.hora === horaEscolhida ? ' picked' : '');
    el.textContent = h.hora;
    if (!h.cheio) {
      el.addEventListener('click', () => {
        horaEscolhida = h.hora;
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
  const veioDeBanho = sessionStorage.getItem('tipoServico') === 'banho';
  window.location.href = veioDeBanho ? 'banho-tosa.html' : 'servico.html';
});

btnContinuar.addEventListener('click', () => {
  sessionStorage.setItem('dataEscolhida', diaEscolhido.iso);
  sessionStorage.setItem('horaEscolhida', horaEscolhida);
  window.location.href = 'confirmar.html';
});