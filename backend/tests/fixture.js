import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import request from "supertest";
import { afterEach, afterAll } from "vitest";
import { Op } from "sequelize";
import { app } from "../src/app.js";
import { sequelize } from "../src/config/db.js";
import * as M from "../src/models/index.js";
if (sequelize.config.database !== "gorras_test")
  throw new Error("Solo se permite gorras_test.");
let current;
export { M, app, request, sequelize };
export async function fixture() {
  const key = randomUUID(),
    password = `Clave1-${key}`,
    hash = await bcrypt.hash(password, 12);
  const users = await M.Usuario.bulkCreate(
    ["cliente", "admin", "otro"].map((r) => ({
      nombre: r,
      email: `${r}-${key}@example.test`,
      password_hash: hash,
      rol: r === "admin" ? "admin" : "cliente",
    })),
  );
  const category = await M.Categoria.create({
    nombre: `Prueba ${key}`,
    slug: `prueba-${key}`,
  });
  const product = await M.Producto.create({
    categoria_id: category.id,
    nombre: `Gorra ${key}`,
    slug: `gorra-${key}`,
    descripcion: "Gorra urbana",
    precio: "149.00",
    destacado: 1,
  });
  const variants = await M.Variante.bulkCreate(
    [
      { color_nombre: "Negro", talla: "S/M", stock: 5 },
      { color_nombre: "Negro", talla: "L/XL", stock: 0 },
      { color_nombre: "Arena", talla: "S/M", stock: 2 },
    ].map((v, i) => ({
      ...v,
      producto_id: product.id,
      sku: `${key}-${i}`,
      color_hex: "#14110F",
    })),
  );
  const client = request.agent(app),
    admin = request.agent(app);
  current = {
    key,
    password,
    users,
    category,
    product,
    variants,
    client,
    admin,
    products: [product.id],
  };
  await client
    .post("/api/auth/login")
    .send({ email: users[0].email, password })
    .expect(200);
  await admin
    .post("/api/auth/login")
    .send({ email: users[1].email, password })
    .expect(200);
  return current;
}
export const delivery = {
  nombre_destinatario: "Cliente Prueba",
  telefono_contacto: "55550101",
  direccion_envio: "Calle de prueba 10",
  ciudad: "Guatemala",
  metodo_pago: "contra_entrega",
};
afterEach(async () => {
  if (!current) return;
  const userIds = current.users.map((u) => u.id);
  const orders = await M.Pedido.findAll({
    where: { usuario_id: { [Op.in]: userIds } },
    attributes: ["id"],
    raw: true,
  });
  const orderIds = orders.map((p) => p.id);
  if (orderIds.length) {
    await M.HistorialEstadoPedido.destroy({
      where: { pedido_id: { [Op.in]: orderIds } },
    });
    await M.MovimientoInventario.destroy({
      where: { pedido_id: { [Op.in]: orderIds } },
    });
    await M.PedidoItem.destroy({ where: { pedido_id: { [Op.in]: orderIds } } });
    await M.Pedido.destroy({ where: { id: { [Op.in]: orderIds } } });
  }
  const vars = await M.Variante.findAll({
    where: { producto_id: { [Op.in]: current.products } },
    attributes: ["id"],
    raw: true,
  });
  if (vars.length) {
    const ids = vars.map((v) => v.id);
    await M.CarritoItem.destroy({ where: { variante_id: { [Op.in]: ids } } });
    await M.MovimientoInventario.destroy({
      where: { variante_id: { [Op.in]: ids } },
    });
  }
  await M.Producto.destroy({ where: { id: { [Op.in]: current.products } } });
  await M.Categoria.destroy({ where: { id: current.category.id } });
  await M.Usuario.destroy({ where: { id: { [Op.in]: userIds } } });
  current = null;
});
afterAll(() => sequelize.close());
