import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeAll, afterAll, expect, test } from 'vitest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const suffix=randomUUID(), admin=request.agent(app), cliente=request.agent(app);
let adminId,clienteId,categoriaId,productoId;
beforeAll(async()=>{
  if(env.DB_NAME!=='gorras_test')throw new Error('Solo gorras_test.');
  const password=`Clave1-${suffix}`,hash=await bcrypt.hash(password,12);
  for(const rol of ['admin','cliente']){
    const [u]=await pool.execute('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)',[rol,`${rol}-${suffix}@example.test`,hash,rol]);
    if(rol==='admin')adminId=u.insertId;else clienteId=u.insertId;
    await (rol==='admin'?admin:cliente).post('/api/auth/login').send({email:`${rol}-${suffix}@example.test`,password}).expect(200);
  }
  const [c]=await pool.execute('INSERT INTO categorias (nombre,slug) VALUES (?,?)',[`Admin ${suffix}`,`admin-${suffix}`]);categoriaId=c.insertId;
});
afterAll(async()=>{
  try{
    if(productoId){await pool.execute('DELETE m FROM movimientos_inventario m JOIN variantes v ON v.id=m.variante_id WHERE v.producto_id=?',[productoId]);await pool.execute('DELETE FROM productos WHERE id=?',[productoId]);}
    if(categoriaId)await pool.execute('DELETE FROM categorias WHERE id=?',[categoriaId]);
    if(adminId)await pool.execute('DELETE FROM usuarios WHERE id IN (?,?)',[adminId,clienteId]);
  }finally{await pool.end();}
});
test('cliente recibe 403 en resumen y administrador recibe métricas',async()=>{
  await cliente.get('/api/admin/resumen').expect(403);
  const r=await admin.get('/api/admin/resumen').expect(200);
  expect(r.body.data).toHaveProperty('ventas_mes');expect(r.body.data.ventas).toHaveLength(7);
});
test('admin crea producto con variante y ajusta stock con movimiento registrado',async()=>{
  const p=await admin.post('/api/admin/productos').send({nombre:`Gorra ${suffix}`,categoria_id:categoriaId,precio:149,variantes:[{color_nombre:'Negro',color_hex:'#14110F',talla:'S/M',stock:2}]}).expect(201);
  productoId=p.body.data.id;
  const [[v]]=await pool.execute('SELECT id,stock FROM variantes WHERE producto_id=?',[productoId]);expect(v.stock).toBe(2);
  await admin.post('/api/admin/inventario/ajuste').send({varianteId:v.id,cantidad:3,motivo:'Reposición de prueba'}).expect(200);
  const [[stock]]=await pool.execute('SELECT stock FROM variantes WHERE id=?',[v.id]);expect(stock.stock).toBe(5);
  const [mov]=await pool.execute('SELECT tipo,cantidad,stock_resultante,motivo FROM movimientos_inventario WHERE variante_id=? ORDER BY id',[v.id]);
  expect(mov[1]).toMatchObject({tipo:'ajuste',cantidad:3,stock_resultante:5,motivo:'Reposición de prueba'});
  await admin.post('/api/admin/inventario/ajuste').send({varianteId:v.id,cantidad:-6}).expect(409);
});
