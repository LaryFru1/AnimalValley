import { supabase } from './supabase-client.js';

document.getElementById('login-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const email = document.getElementById('login-user').value;
  const senha = document.getElementById('login-pass').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: senha
  });

  if (error) {
    alert('Não foi possível entrar: ' + error.message);
    return;
  }

  // Conta desativada não entra
  const { data: resp } = await supabase
    .from('responsaveis')
    .select('status')
    .eq('id', data.user.id)
    .single();

  if (resp && resp.status === 'desativado') {
    await supabase.auth.signOut();
    alert('Este cadastro foi desativado. Para reativar, entre em contato com a clínica.');
    return;
  }

  window.location.href = 'inicio.html';
});

document.getElementById('btn-esqueci').addEventListener('click', async function(){
  const email = prompt('Digite seu e-mail cadastrado:');
  if (!email) return;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/redefinir-senha.html'
  });

  if (error) {
    alert('Erro: ' + error.message);
  } else {
    alert('Enviamos um e-mail com um link para você redefinir sua senha!');
  }
});

document.getElementById('go-signup').addEventListener('click', function(){
  window.location.href = 'cadastro.html';
});