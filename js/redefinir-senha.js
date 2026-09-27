import { supabase } from './supabase-client.js';

document.getElementById('form-redefinir').addEventListener('submit', async function(e){
  e.preventDefault();

  const novaSenha = document.getElementById('nova-senha').value;
  const confirmaSenha = document.getElementById('confirma-senha').value;

  if (novaSenha !== confirmaSenha) {
    alert('As senhas não coincidem.');
    return;
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    alert('Erro ao redefinir senha: ' + error.message);
    return;
  }

  alert('Senha atualizada com sucesso! Faça login com a nova senha.');
  window.location.href = 'index.html';
});