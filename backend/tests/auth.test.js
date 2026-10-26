import { randomUUID } from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { requireAuth } from '../src/middlewares/requireAuth.js';
import { requireRole } from '../src/middlewares/requireRole.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

const suffix = randomUUID();
const clienteEmail = `cliente-${suffix}@example.test`;
const adminEmail = `admin-${suffix}@example.test`;
const registroEmail = `registro-${suffix}@example.test`;
const password = `Clave1-${suffix}`;
const protegida = express();
protegida.use(cookieParser());
protegida.get('/admin', requireAuth, requireRole('admin'), (_req, res) => res.json({ ok: true }));
protegida.use(errorHandler);

beforeAll(async () => {
  if (env.DB_NAME !== 'gorras_test') throw new Error('Las pruebas solo pueden usar gorras_test.');
  const hash = await bcrypt.hash(password, 12);
  await pool.execute(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
    ['Cliente', clienteEmail, hash, 'cliente', 'Admin', adminEmail, hash, 'admin'],
  );
});

afterAll(async () => {
  try {
    await pool.execute('DELETE FROM usuarios WHERE email IN (?, ?, ?)', [clienteEmail, adminEmail, registroEmail]);
  } finally {
    await pool.end();
  }
});

test('registro crea cliente, valida contraseña y nunca acepta rol ni devuelve el hash', async () => {
  const body = { nombre: 'Cliente nuevo', email: registroEmail, password };
  await request(app).post('/api/auth/registro').send({ ...body, rol: 'admin' }).expect(422);
  await request(app).post('/api/auth/registro').send({ ...body, password: 'sin-numero' }).expect(422);
  const response = await request(app).post('/api/auth/registro').send(body).expect(201);
  expect(response.body).toMatchObject({ ok: true, data: { usuario: { email: registroEmail, rol: 'cliente' } } });
  expect(response.body.data.usuario).not.toHaveProperty('password_hash');
  expect(response.body.data.usuario).not.toHaveProperty('password');
  const [[usuario]] = await pool.execute('SELECT password_hash FROM usuarios WHERE email = ?', [registroEmail]);
  expect(bcrypt.getRounds(usuario.password_hash)).toBe(12);
  expect(await bcrypt.compare(password, usuario.password_hash)).toBe(true);
  expect(JSON.stringify(response.body)).not.toContain(usuario.password_hash);
  await request(app).post('/api/auth/registro').send(body).expect(409);
});

test('login entrega cookie, restaura sesión y devuelve 401 con clave errónea o usuario inactivo; logout borra la cookie', async () => {
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({ email: clienteEmail, password }).expect(200);
  expect(login.headers['set-cookie'][0]).toMatch(/visera_sesion=.*HttpOnly.*SameSite=Lax/);
  expect(login.headers['set-cookie'][0]).toContain('Max-Age=28800');
  const yo = await agent.get('/api/auth/yo').expect(200);
  expect(yo.body.data.usuario.email).toBe(clienteEmail);
  expect(yo.body.data.usuario).not.toHaveProperty('password_hash');
  const wrong = await request(app).post('/api/auth/login').send({ email: clienteEmail, password: 'Incorrecta1' }).expect(401);
  const absent = await request(app).post('/api/auth/login').send({ email: `ausente-${suffix}@example.test`, password }).expect(401);
  expect(wrong.body).toEqual(absent.body);
  await pool.execute('UPDATE usuarios SET activo = 0 WHERE email = ?', [clienteEmail]);
  const inactive = await request(app).post('/api/auth/login').send({ email: clienteEmail, password }).expect(401);
  expect(inactive.body).toEqual(wrong.body);
  await agent.get('/api/auth/yo').expect(401);
  await pool.execute('UPDATE usuarios SET activo = 1 WHERE email = ?', [clienteEmail]);
  const logout = await agent.post('/api/auth/logout').send({}).expect(200);
  expect(logout.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
  await agent.get('/api/auth/yo').expect(401);
});

test('requireRole impide acceso al cliente con 403 y permite al administrador con 200', async () => {
  const cliente = await request(app).post('/api/auth/login').send({ email: clienteEmail, password }).expect(200);
  const admin = await request(app).post('/api/auth/login').send({ email: adminEmail, password }).expect(200);
  await request(protegida).get('/admin').expect(401);
  await request(protegida).get('/admin').set('Cookie', cliente.headers['set-cookie']).expect(403);
  await request(protegida).get('/admin').set('Cookie', admin.headers['set-cookie']).expect(200);
});
