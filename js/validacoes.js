export function formatarTelefone(valor){
  const v = (valor || '').replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  if (v.length > 0) return '(' + v;
  return '';
}

export function aplicarMascaraTelefone(input){
  input.addEventListener('input', () => {
    input.value = formatarTelefone(input.value);
  });
}

export function telefoneValido(tel){
  const digitos = (tel || '').replace(/\D/g, '');
  if (digitos.length !== 10 && digitos.length !== 11) return false;
  if (digitos[0] === '0' || digitos[1] === '0') return false;
  if (digitos.length === 11 && digitos[2] !== '9') return false;
  return true;
}