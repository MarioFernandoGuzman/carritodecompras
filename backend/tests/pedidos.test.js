import { expect, test } from "vitest";
import { fixture, M, delivery, request, app } from "./fixture.js";
async function buy(f, method = "contra_entrega") {
  await f.client
    .post("/api/carrito/items")
    .send({ varianteId: f.variants[0].id, cantidad: 2 })
    .expect(201);
  return (
    await f.client
      .post("/api/pedidos")
      .send({
        ...delivery,
        metodo_pago: method,
        ...(method === "tarjeta"
          ? { pago_marca: "visa", pago_ultimos4: "4242" }
          : {}),
      })
      .expect(201)
  ).body.data;
}
test("checkout conserva snapshots, descuenta stock, registra historial y vacía el carrito", async () => {
  const f = await fixture(),
    p = await buy(f, "tarjeta");
  expect(p.estado).toBe("pagado");
  expect(p.total).toBe("323.00");
  await M.Producto.update(
    { nombre: "Nombre posterior", precio: "1.00" },
    { where: { id: f.product.id } },
  );
  const detail = await f.client.get(`/api/pedidos/${p.id}`).expect(200);
  expect(detail.body.data.items[0].nombre_producto).toBe(f.product.nombre);
  expect(detail.body.data.items[0].precio_unitario).toBe("149.00");
  expect((await M.Variante.findByPk(f.variants[0].id)).stock).toBe(3);
  expect(
    await M.MovimientoInventario.count({
      where: { pedido_id: p.id, tipo: "salida_venta" },
    }),
  ).toBe(1);
  expect(
    await M.HistorialEstadoPedido.count({ where: { pedido_id: p.id } }),
  ).toBe(1);
  expect((await f.client.get("/api/carrito")).body.data.items).toEqual([]);
  const other = request.agent(app);
  await other
    .post("/api/auth/login")
    .send({ email: f.users[2].email, password: f.password })
    .expect(200);
  await other.get(`/api/pedidos/${p.id}`).expect(404);
});
test("stock insuficiente revierte pedido, movimientos y carrito", async () => {
  const f = await fixture();
  await f.client
    .post("/api/carrito/items")
    .send({ varianteId: f.variants[0].id, cantidad: 5 })
    .expect(201);
  await M.Variante.update({ stock: 1 }, { where: { id: f.variants[0].id } });
  await f.client.post("/api/pedidos").send(delivery).expect(409);
  expect(await M.Pedido.count({ where: { usuario_id: f.users[0].id } })).toBe(
    0,
  );
  expect((await M.Variante.findByPk(f.variants[0].id)).stock).toBe(1);
  const cart = await M.Carrito.findOne({
    where: { usuario_id: f.users[0].id },
  });
  expect(
    (await M.CarritoItem.findOne({ where: { carrito_id: cart.id } })).cantidad,
  ).toBe(5);
  expect(
    await M.MovimientoInventario.count({
      where: { usuario_id: f.users[0].id },
    }),
  ).toBe(0);

  // Two different buyers compete for three units; only one checkout may commit.
  await M.Variante.update({ stock: 3 }, { where: { id: f.variants[0].id } });
  await M.CarritoItem.update(
    { cantidad: 2 },
    { where: { carrito_id: cart.id } },
  );
  const other = request.agent(app);
  await other
    .post("/api/auth/login")
    .send({ email: f.users[2].email, password: f.password })
    .expect(200);
  await other
    .post("/api/carrito/items")
    .send({ varianteId: f.variants[0].id, cantidad: 2 })
    .expect(201);
  const results = await Promise.all([
    f.client.post("/api/pedidos").send(delivery),
    other.post("/api/pedidos").send(delivery),
  ]);
  expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  expect((await M.Variante.findByPk(f.variants[0].id)).stock).toBe(1);
  const loser = results[0].status === 409 ? f.users[0].id : f.users[2].id;
  const pending = await M.Carrito.findOne({ where: { usuario_id: loser } });
  expect(
    (await M.CarritoItem.findOne({ where: { carrito_id: pending.id } }))
      .cantidad,
  ).toBe(2);
  expect(
    await M.MovimientoInventario.count({
      where: { variante_id: f.variants[0].id, tipo: "salida_venta" },
    }),
  ).toBe(1);
});
test("cancelaciones y transiciones conservan permisos y devuelven existencias una sola vez", async () => {
  const f = await fixture(),
    p = await buy(f);
  await f.admin
    .patch(`/api/admin/pedidos/${p.id}/estado`)
    .send({ estado: "enviado" })
    .expect(409);
  await f.admin
    .patch(`/api/admin/pedidos/${p.id}/estado`)
    .send({ estado: "pagado" })
    .expect(200);
  await f.admin
    .patch(`/api/admin/pedidos/${p.id}/estado`)
    .send({ estado: "enviado" })
    .expect(200);
  await f.client.post(`/api/pedidos/${p.id}/cancelar`).send({}).expect(409);
  await f.admin
    .patch(`/api/admin/pedidos/${p.id}/estado`)
    .send({ estado: "cancelado" })
    .expect(200);
  await f.admin
    .patch(`/api/admin/pedidos/${p.id}/estado`)
    .send({ estado: "cancelado" })
    .expect(409);
  expect((await M.Variante.findByPk(f.variants[0].id)).stock).toBe(5);
  expect(
    await M.MovimientoInventario.count({
      where: { pedido_id: p.id, tipo: "devolucion_cancelacion" },
    }),
  ).toBe(1);
  const again = await buy(f);
  await f.client.post(`/api/pedidos/${again.id}/cancelar`).send({}).expect(200);
  expect((await M.Variante.findByPk(f.variants[0].id)).stock).toBe(5);
});
