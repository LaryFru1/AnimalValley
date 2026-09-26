// Dados fictícios por enquanto — depois vêm do Supabase, ligados à conta logada.
const historico = [
  { desc: 'Thor · Banho P', data: '23/09', status: 'Aguardando' },
  { desc: 'Thor · Consulta', data: '02/09', status: 'Concluído' },
  { desc: 'Mimi · Banho + Tosa P', data: '10/09', status: 'Concluído' }
];

const container = document.getElementById('lista-historico');
historico.forEach(h => {
  const div = document.createElement('div');
  div.className = 'hist-item';
  const classeStatus = h.status === 'Concluído' ? 'st-ok' : 'st-wait';
  div.innerHTML = `<span>${h.desc} — ${h.data}</span><span class="${classeStatus}">${h.status}</span>`;
  container.appendChild(div);
});

document.getElementById('btn-comunidade').addEventListener('click', () => {
  window.location.href = 'https://chat.whatsapp.com/K6ysecIycGJ27xf0GINMhS';
});

document.getElementById('nav-home').addEventListener('click', () => window.location.href = 'inicio.html');
document.getElementById('nav-pets').addEventListener('click', () => window.location.href = 'meus-pets.html');
document.getElementById('btn-config').addEventListener('click', () => window.location.href = 'configuracoes.html');