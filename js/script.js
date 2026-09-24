document.getElementById('login-form').addEventListener('submit', function(e){
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  console.log('Tentando entrar com:', user);
  // Por enquanto não faz login de verdade — isso vem quando ligarmos o Supabase.
});

document.getElementById('go-signup').addEventListener('click', function(){
  alert('Aqui depois vamos abrir a tela de cadastro.');
});