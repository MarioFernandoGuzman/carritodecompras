import { expect, test } from "vitest";
import { fixture, app, request } from "./fixture.js";
test("catálogo pagina y filtra color y talla en la misma variante, mantiene agotado global", async () => {
  const f = await fixture();
  const res = await request(app)
    .get("/api/productos")
    .query({
      categoria: f.category.slug,
      color: "Negro",
      talla: "L/XL",
      limite: 1,
    })
    .expect(200);
  expect(res.body.data.paginacion.total).toBe(1);
  expect(res.body.data.productos[0].agotado).toBe(false);
  const empty = await request(app)
    .get("/api/productos")
    .query({ categoria: f.category.slug, pagina: 99, limite: 1 })
    .expect(200);
  expect(empty.body.data.productos).toEqual([]);
  expect(empty.body.data.paginacion.total).toBe(1);
  const detail = await request(app)
    .get(`/api/productos/${f.product.slug}`)
    .expect(200);
  expect(detail.body.data.variantes).toHaveLength(3);
});
test("búsqueda literal no interpreta porcentajes o guiones bajos como comodines", async () => {
  const f = await fixture();
  const found = await request(app)
    .get("/api/productos")
    .query({ categoria: f.category.slug, buscar: "Gorra urbana" })
    .expect(200);
  expect(found.body.data.paginacion.total).toBe(1);
  const short = await request(app)
    .get("/api/productos")
    .query({ categoria: f.category.slug, buscar: "zz" })
    .expect(200);
  expect(short.body.data.productos).toEqual([]);
  for (const buscar of ["%", "_", "Gorra%", "Gorra_"]) {
    const r = await request(app)
      .get("/api/productos")
      .query({ categoria: f.category.slug, buscar })
      .expect(200);
    expect(r.body.data.productos).toEqual([]);
  }
});
