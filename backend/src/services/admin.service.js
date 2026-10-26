import bcrypt from "bcrypt";
import { guardarAdmin } from "../repositories/admin.repository.js";

export async function crearOActualizarAdmin({ nombre, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  await guardarAdmin({ nombre, email, passwordHash });
}
