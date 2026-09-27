import { supabase } from './supabase-client.js';

// 1. Verifica se está logado — se não estiver, manda pro login
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'index.html';
}
const userId = session.user.id;

// 2. Busca o nome do responsável
const { data: responsavel } = await supabase
  .from('responsaveis')
  .select('nome')
  .eq('id', userId)
  .single();

const primeiroNome = responsavel ? responsavel.nome.split(' ')[0] : '';
document.getElementById('saudacao').textContent = `Olá, ${primeiroNome} 👋`;

// 3. Busca os pets desse responsável (por enquanto só usamos o primeiro)
const { data: pets } = await supabase
  .from('pets')
  .select('*')
  .eq('responsavel_id', userId);

if (pets && pets.length > 0) {
  sessionStorage.setItem('petEscolhido', pets[0].nome);
  sessionStorage.setItem('petPeso', pets[0].peso);
}

document.getElementById('btn-agendar').addEventListener('click', function(){
  window.location.href = 'escolher-pet.html';
});

document.getElementById('btn-comunidade').addEventListener('click', function(){
  window.location.href = 'https://chat.whatsapp.com/K6ysecIycGJ27xf0GINMhS';
});

document.getElementById('nav-pets').addEventListener('click', function(){
  window.location.href = 'meus-pets.html';
});

document.getElementById('nav-conta').addEventListener('click', function(){
  window.location.href = 'conta.html';
});
document.getElementById('btn-anexar').addEventListener('click', function(){
  alert('Aqui depois vamos abrir o seletor de arquivo (PDF/imagem) e subir pro Supabase Storage.');
});