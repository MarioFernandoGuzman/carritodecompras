export function validarAuth(values, registro) {
  const errors = {};
  if (registro && (!values.nombre.trim() || values.nombre.trim().length > 100)) errors.nombre = 'Ingresa tu nombre (máximo 100 caracteres).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) || values.email.trim().length > 150) errors.email = 'Ingresa un correo válido.';
  if (!values.password) errors.password = 'Ingresa tu contraseña.';
  else if (registro && (values.password.length < 8 || !/\p{L}/u.test(values.password) || !/[0-9]/.test(values.password))) errors.password = 'Usa 8 caracteres como mínimo, una letra y un número.';
  else if (registro && new TextEncoder().encode(values.password).length > 72) errors.password = 'La contraseña no puede superar 72 bytes.';
  return errors;
}
