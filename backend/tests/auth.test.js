import { expect, test } from "vitest";
import { fixture, M, app, request } from "./fixture.js";
test("registro valida datos, crea cliente sin revelar hash y rechaza correo duplicado", async () => {
  const f = await fixture(),
    email = `registro-${f.key}@example.test`;
  try {
    await request(app)
      .post("/api/auth/registro")
      .send({ nombre: "Nuevo", email, password: "corta" })
      .expect(422);
    await request(app)
      .post("/api/auth/registro")
      .send({ nombre: "Nuevo", email, password: f.password, rol: "admin" })
      .expect(422);
    const res = await request(app)
      .post("/api/auth/registro")
      .send({ nombre: "Nuevo", email, password: f.password })
      .expect(201);
    expect(res.body.data.usuario.rol).toBe("cliente");
    expect(JSON.stringify(res.body)).not.toContain("password_hash");
    expect(res.headers["set-cookie"][0]).toContain("HttpOnly");
    await request(app)
      .post("/api/auth/registro")
      .send({ nombre: "Nuevo", email, password: f.password })
      .expect(409);
  } finally {
    await M.Usuario.destroy({ where: { email } });
  }
});
test("sesión, login inválido, activación, logout y permisos se conservan con ORM", async () => {
  const f = await fixture();
  await f.client.get("/api/auth/yo").expect(200);
  await request(app)
    .post("/api/auth/login")
    .send({ email: f.users[0].email, password: "Erronea123" })
    .expect(401);
  await f.client.get("/api/admin/resumen").expect(403);
  const res = await f.admin.get("/api/admin/resumen").expect(200);
  expect(res.body.data.ventas).toHaveLength(7);
  await M.Usuario.update({ activo: 0 }, { where: { id: f.users[0].id } });
  await f.client.get("/api/auth/yo").expect(401);
  await f.admin.post("/api/auth/logout").send({}).expect(200);
  await f.admin.get("/api/auth/yo").expect(401);
});
