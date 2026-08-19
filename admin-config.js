// Lista de usuarios de administración autorizados (agregar acá los nuevos)
export const ADMIN_USUARIOS = ["usuario8", "victoria"];

const ADMIN_DOMINIO = "admin.granprix.local";

export function usuarioAEmail(usuario) {
  return `${usuario.toLowerCase().trim()}@${ADMIN_DOMINIO}`;
}