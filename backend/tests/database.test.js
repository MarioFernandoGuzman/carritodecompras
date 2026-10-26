import { execFile } from "node:child_process";
import { promisify } from "node:util";
import bcrypt from "bcrypt";
import { expect, test } from "vitest";
import { fixture, M } from "./fixture.js";
const run = promisify(execFile);
test("la base mantiene CHECK, unicidad, FK y cascada al usar modelos", async () => {
  const f = await fixture();
  const data = {
    producto_id: f.product.id,
    sku: `extra-${f.key}`,
    color_nombre: "Otro",
    color_hex: "#FFFFFF",
    talla: "S/M",
    stock: -1,
  };
  const error = await M.Variante.create(data, { validate: false }).catch(
    (e) => e,
  );
  expect(error.name).toBe("SequelizeDatabaseError");
  expect(error.original.message).toMatch(/constraint|check/i);
  await expect(
    M.Variante.create({ ...data, sku: f.variants[0].sku, stock: 1 }),
  ).rejects.toHaveProperty("name", "SequelizeUniqueConstraintError");
  await expect(
    M.Variante.create({ ...data, producto_id: 0, stock: 1 }),
  ).rejects.toHaveProperty("name", "SequelizeForeignKeyConstraintError");
  const p = await M.Producto.create({
    categoria_id: f.category.id,
    nombre: "Temporal",
    slug: `temporal-${f.key}`,
    precio: "10.00",
  });
  f.products.push(p.id);
  const v = await M.Variante.create({
    ...data,
    producto_id: p.id,
    sku: `cascade-${f.key}`,
    stock: 1,
  });
  await p.destroy();
  expect(await M.Variante.findByPk(v.id)).toBeNull();
});
test("create-admin actualiza por email sin cambiar identidad o fecha de creación ni mostrar secretos", async () => {
  const f = await fixture(),
    email = f.users[2].email,
    created = (await M.Usuario.findByPk(f.users[2].id)).creado_en.getTime();
  const env = {
    ...process.env,
    NODE_ENV: "test",
    DB_NAME: "gorras_test",
    ADMIN_EMAIL: email,
    ADMIN_NOMBRE: "Admin actualizado",
    ADMIN_PASSWORD: f.password,
  };
  const res = await run(process.execPath, ["scripts/create-admin.js"], {
    env,
    timeout: 10000,
  });
  const u = await M.Usuario.findByPk(f.users[2].id);
  expect(u.rol).toBe("admin");
  expect(u.creado_en.getTime()).toBe(created);
  expect(bcrypt.getRounds(u.password_hash)).toBe(12);
  expect(await bcrypt.compare(f.password, u.password_hash)).toBe(true);
  expect(res.stdout + res.stderr).not.toContain(f.password);
  await expect(
    run(process.execPath, ["scripts/create-admin.js"], {
      env: { ...env, ADMIN_PASSWORD: "corta" },
      timeout: 10000,
    }),
  ).rejects.toHaveProperty("code", 1);
});
