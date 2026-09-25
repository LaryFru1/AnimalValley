// Por enquanto os dados são fixos (fake). Depois vêm do Supabase.
document.getElementById('saudacao').textContent = 'Olá, Ana 👋';

document.getElementById('btn-agendar').addEventListener('click', function(){
  alert('Aqui depois vamos abrir a tela de escolher o pet.');
});

document.getElementById('btn-comunidade').addEventListener('click', function(){
  alert('Aqui depois vamos linkar o convite da comunidade no WhatsApp.');
});

document.getElementById('nav-pets').addEventListener('click', function(){
  window.location.href = 'meus-pets.html';
});

document.getElementById('nav-conta').addEventListener('click', function(){
  alert('Aqui depois vamos abrir a tela "Minha conta".');
});
document.getElementById('btn-anexar').addEventListener('click', function(){
  alert('Aqui depois vamos abrir o seletor de arquivo (PDF/imagem) e subir pro Supabase Storage.');
});