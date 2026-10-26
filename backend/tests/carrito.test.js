import { expect, test } from "vitest";
import { fixture } from "./fixture.js";
test("carrito suma, modifica y elimina con importes de servidor y envío gratis", async () => {
  const f = await fixture(),
    varianteId = f.variants[0].id;
  let r = await f.client
    .post("/api/carrito/items")
    .send({ varianteId, cantidad: 1 })
    .expect(201);
  expect(r.body.data.total).toBe("174.00");
  r = await f.client
    .post("/api/carrito/items")
    .send({ varianteId, cantidad: 2 })
    .expect(201);
  expect(r.body.data.total).toBe("447.00");
  expect(r.body.data.envio).toBe("0.00");
  const id = r.body.data.items[0].id;
  r = await f.client
    .patch(`/api/carrito/items/${id}`)
    .send({ cantidad: 2 })
    .expect(200);
  expect(r.body.data.total).toBe("323.00");
  r = await f.client.delete(`/api/carrito/items/${id}`).expect(200);
  expect(r.body.data.items).toEqual([]);
});
test("stock se respeta y fusión recorta u omite variantes inválidas", async () => {
  const f = await fixture(),
    varianteId = f.variants[0].id;
  await f.client
    .post("/api/carrito/items")
    .send({ varianteId, cantidad: 6 })
    .expect(409);
  const r = await f.client
    .post("/api/carrito/fusionar")
    .send({
      items: [
        { varianteId, cantidad: 4 },
        { varianteId, cantidad: 4 },
        { varianteId: f.variants[1].id, cantidad: 1 },
        { varianteId: 4294967295, cantidad: 1 },
      ],
    })
    .expect(200);
  expect(r.body.data.items).toHaveLength(1);
  expect(r.body.data.items[0].cantidad).toBe(5);
  expect(r.body.data.avisos.length).toBeGreaterThan(0);
  await f.admin.get("/api/carrito").expect(403);
});
