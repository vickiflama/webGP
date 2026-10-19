// Los administradores ya NO se habilitan desde acá.
// Para habilitar a alguien: en la consola de Firebase (Firestore Database > Datos)
// creá un documento en la colección "adminsPermitidos" cuyo ID sea el correo
// del usuario, por ejemplo:  usuario8@admin.granprix.local
// Después esa persona se registra sola en admin-registro.html.

const ADMIN_DOMINIO = "admin.granprix.local";

export function usuarioAEmail(usuario) {
  return `${usuario.toLowerCase().trim()}@${ADMIN_DOMINIO}`;
}
