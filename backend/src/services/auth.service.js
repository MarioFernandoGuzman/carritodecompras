import { databaseErrorCode } from "../utils/databaseErrorCode.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
  buscarPorEmail,
  buscarPorId,
  crearCliente,
} from "../repositories/usuarios.repository.js";
import { HttpError } from "../utils/HttpError.js";

export function usuarioPublico(usuario) {
  const { id, nombre, email, telefono, rol } = usuario;
  return { id, nombre, email, telefono, rol };
}

export async function registrar(datos) {
  const passwordHash = await bcrypt.hash(datos.password, 12);
  try {
    const id = await crearCliente({ ...datos, passwordHash });
    return usuarioPublico(await buscarPorId(id));
  } catch (error) {
    if (databaseErrorCode(error) === "ER_DUP_ENTRY")
      throw new HttpError(409, "No se pudo registrar ese correo.");
    throw error;
  }
}

// Mantiene el trabajo de bcrypt incluso cuando el correo no existe.
const dummyHash = bcrypt.hash("comparacion-interna-sin-cuenta", 12);

export async function ingresar({ email, password }) {
  const usuario = await buscarPorEmail(email);
  const coincide = await bcrypt.compare(
    password,
    usuario?.password_hash || (await dummyHash),
  );
  if (!usuario || !coincide || !usuario.activo)
    throw new HttpError(401, "Correo o contraseña incorrectos.");
  return usuarioPublico(usuario);
}

export function firmarSesion(usuario) {
  if (!env.JWT_SECRET)
    throw new HttpError(503, "El inicio de sesión no está disponible.");
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(usuario.id),
    expiresIn: "8h",
    issuer: "visera-api",
    audience: "visera-web",
  });
}
