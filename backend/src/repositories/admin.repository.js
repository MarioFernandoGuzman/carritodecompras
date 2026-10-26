import { Usuario } from "../models/index.js";
export async function guardarAdmin({ nombre, email, passwordHash }) {
  const values = {
    nombre,
    email,
    password_hash: passwordHash,
    rol: "admin",
    activo: 1,
  };
  const [user, created] = await Usuario.findOrCreate({
    where: { email },
    defaults: values,
  });
  if (!created) await user.update(values);
}
