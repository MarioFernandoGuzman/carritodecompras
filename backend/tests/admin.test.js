import { expect, test } from "vitest";
import { fixture, M, delivery } from "./fixture.js";
test("admin crea y edita producto y variante, ajusta stock y consulta todos los recursos", async () => {
  const f = await fixture();
  const p = (
    await f.admin
      .post("/api/admin/productos")
      .send({
        nombre: `Nueva ${f.key}`,
        categoria_id: f.category.id,
        precio: 159,
        variantes: [
          {
            color_nombre: "Negro",
            color_hex: "#14110F",
            talla: "S/M",
            stock: 2,
          },
        ],
      })
      .expect(201)
  ).body.data;
  f.products.push(p.id);
  let v = await M.Variante.findOne({ where: { producto_id: p.id } });
  await f.admin
    .post("/api/admin/inventario/ajuste")
    .send({ varianteId: v.id, cantidad: 3, motivo: "Reposición" })
    .expect(200);
  expect((await v.reload()).stock).toBe(5);
  await f.admin
    .post("/api/admin/inventario/ajuste")
    .send({ varianteId: v.id, cantidad: -6 })
    .expect(409);
  await f.admin
    .put(`/api/admin/variantes/${v.id}`)
    .send({
      color_nombre: "Negro",
      color_hex: "#14110F",
      talla: "S/M",
      stock: 4,
      stock_minimo: 3,
      activo: true,
    })
    .expect(200);
  expect((await v.reload()).stock).toBe(4);
  await f.admin
    .post(`/api/admin/productos/${p.id}/variantes`)
    .send({ color_nombre: "Negro", color_hex: "#14110F", talla: "S/M" })
    .expect(409);
  for (const url of [
    "/api/admin/resumen",
    "/api/admin/productos",
    "/api/admin/inventario?bajo=1",
    "/api/admin/inventario?agotado=1",
    "/api/admin/inventario/movimientos",
    "/api/admin/pedidos",
    "/api/admin/usuarios",
    "/api/admin/clientes",
  ])
    await f.admin.get(url).expect(200);
  await f.admin.delete(`/api/admin/productos/${p.id}`).expect(200);
  expect(await M.Producto.findByPk(p.id)).toBeNull();
});
test("admin protege su cuenta, administra otras y desactiva productos con historial", async () => {
  const f = await fixture();
  await f.admin
    .patch(`/api/admin/usuarios/${f.users[1].id}`)
    .send({ activo: false })
    .expect(409);
  await f.admin
    .patch(`/api/admin/usuarios/${f.users[2].id}`)
    .send({ rol: "admin", activo: false })
    .expect(200);
  expect((await M.Usuario.findByPk(f.users[2].id)).activo).toBe(0);
  await f.client
    .post("/api/carrito/items")
    .send({ varianteId: f.variants[0].id, cantidad: 1 })
    .expect(201);
  const p = (await f.client.post("/api/pedidos").send(delivery).expect(201))
    .body.data;
  const r = await f.admin
    .delete(`/api/admin/productos/${f.product.id}`)
    .expect(200);
  expect(r.body.data.desactivado).toBe(true);
  expect((await M.Producto.findByPk(f.product.id)).activo).toBe(0);
  await f.client.get(`/api/pedidos/${p.id}`).expect(200);
  const rows = (await f.admin.get("/api/admin/clientes")).body.data;
  const buyer = rows.find((u) => u.id === f.users[0].id);
  expect(buyer.total_pedidos).toBe(1);
  expect(buyer.monto_comprado).toBe("174.00");
});
