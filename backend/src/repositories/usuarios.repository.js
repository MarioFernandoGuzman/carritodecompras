import { Usuario } from "../models/index.js";
const publicFields = ["id", "nombre", "email", "telefono", "rol", "activo"];
export const buscarPorEmail = (email) =>
  Usuario.findOne({
    where: { email },
    attributes: [...publicFields, "password_hash"],
    raw: true,
  });
export const buscarPorId = (id) =>
  Usuario.findByPk(id, { attributes: publicFields, raw: true });
export async function crearCliente({ nombre, email, telefono, passwordHash }) {
  return (
    await Usuario.create({
      nombre,
      email,
      telefono,
      password_hash: passwordHash,
      rol: "cliente",
    })
  ).id;
}
