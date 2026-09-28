import { supabase } from './supabase-client.js';

const telaLogin = document.getElementById('tela-login');
const telaPainel = document.getElementById('tela-painel');
const ROTULOS_CARGO = { recepcao: 'Recepção', veterinaria: 'Veterinária' };

function mostrarLogin(){
  telaLogin.style.display = '';
  telaPainel.style.display = 'none';
}

function mostrarPainel(membro){
  telaLogin.style.display = 'none';
  telaPainel.style.display = '';
  document.getElementById('painel-usuario').textContent =
    `${membro.nome} · ${ROTULOS_CARGO[membro.cargo] || membro.cargo}`;
}

// Confere se quem está logado é da equipe
async function verificarAcesso(){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    mostrarLogin();
    return;
  }

  const { data: membro } = await supabase
    .from('equipe')
    .select('nome, cargo, ativo')
    .eq('id', session.user.id)
    .maybeSingle();

  if (!membro || !membro.ativo) {
    await supabase.auth.signOut();
    mostrarLogin();
    alert('Esta conta não tem acesso ao painel da equipe.');
    return;
  }

  mostrarPainel(membro);
}

document.getElementById('form-login-equipe').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { error } = await supabase.auth.signInWithPassword({
    email: document.getElementById('eq-email').value,
    password: document.getElementById('eq-senha').value
  });

  if (error) {
    alert('Não foi possível entrar: ' + error.message);
    return;
  }

  await verificarAcesso();
});

document.getElementById('btn-sair-painel').addEventListener('click', async () => {
  await supabase.auth.signOut();
  mostrarLogin();
});

verificarAcesso();