import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    rol: {
      type: DataTypes.ENUM("cliente", "admin"),
      allowNull: false,
      defaultValue: "cliente",
    },
    activo: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "usuarios",
    indexes: [{ name: "uq_usuarios_email", unique: true, fields: ["email"] }],
  },
);

export const Categoria = sequelize.define(
  "Categoria",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "categorias",
    indexes: [
      { name: "uq_categorias_nombre", unique: true, fields: ["nombre"] },
      { name: "uq_categorias_slug", unique: true, fields: ["slug"] },
    ],
  },
);

export const Producto = sequelize.define(
  "Producto",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    categoria_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    material: { type: DataTypes.STRING(100), allowNull: true },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    destacado: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
    activo: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "productos",
    indexes: [{ name: "uq_productos_slug", unique: true, fields: ["slug"] }],
  },
);

export const Variante = sequelize.define(
  "Variante",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    producto_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    sku: { type: DataTypes.STRING(50), allowNull: false },
    color_nombre: { type: DataTypes.STRING(40), allowNull: false },
    color_hex: { type: DataTypes.CHAR(7), allowNull: false },
    talla: { type: DataTypes.STRING(20), allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    activo: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: "variantes",
    indexes: [
      { name: "uq_variantes_sku", unique: true, fields: ["sku"] },
      {
        name: "uq_variantes_producto_color_talla",
        unique: true,
        fields: ["producto_id", "color_nombre", "talla"],
      },
    ],
  },
);

export const Carrito = sequelize.define(
  "Carrito",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "carritos",
    indexes: [
      { name: "uq_carritos_usuario", unique: true, fields: ["usuario_id"] },
    ],
  },
);

export const CarritoItem = sequelize.define(
  "CarritoItem",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    carrito_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    variante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "carrito_items",
    indexes: [
      {
        name: "uq_carrito_items_carrito_variante",
        unique: true,
        fields: ["carrito_id", "variante_id"],
      },
    ],
  },
);

export const Pedido = sequelize.define(
  "Pedido",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    codigo: { type: DataTypes.STRING(20), allowNull: false },
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "pagado",
        "enviado",
        "entregado",
        "cancelado",
      ),
      allowNull: false,
      defaultValue: "pendiente",
    },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    envio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    nombre_destinatario: { type: DataTypes.STRING(100), allowNull: false },
    telefono_contacto: { type: DataTypes.STRING(20), allowNull: false },
    direccion_envio: { type: DataTypes.STRING(255), allowNull: false },
    ciudad: { type: DataTypes.STRING(80), allowNull: false },
    notas: { type: DataTypes.STRING(255), allowNull: true },
    metodo_pago: {
      type: DataTypes.ENUM("tarjeta", "contra_entrega"),
      allowNull: false,
    },
    pago_marca: { type: DataTypes.STRING(20), allowNull: true },
    pago_ultimos4: { type: DataTypes.CHAR(4), allowNull: true },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "pedidos",
    indexes: [{ name: "uq_pedidos_codigo", unique: true, fields: ["codigo"] }],
  },
);

export const PedidoItem = sequelize.define(
  "PedidoItem",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    pedido_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    variante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nombre_producto: { type: DataTypes.STRING(150), allowNull: false },
    color_nombre: { type: DataTypes.STRING(40), allowNull: false },
    color_hex: { type: DataTypes.CHAR(7), allowNull: false },
    talla: { type: DataTypes.STRING(20), allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: "pedido_items", indexes: [] },
);

export const MovimientoInventario = sequelize.define(
  "MovimientoInventario",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    variante_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tipo: {
      type: DataTypes.ENUM(
        "entrada",
        "salida_venta",
        "ajuste",
        "devolucion_cancelacion",
      ),
      allowNull: false,
    },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    stock_resultante: { type: DataTypes.INTEGER, allowNull: false },
    motivo: { type: DataTypes.STRING(255), allowNull: true },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    pedido_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: "movimientos_inventario", indexes: [] },
);

export const HistorialEstadoPedido = sequelize.define(
  "HistorialEstadoPedido",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    pedido_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "pagado",
        "enviado",
        "entregado",
        "cancelado",
      ),
      allowNull: false,
    },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: "historial_estado_pedido", indexes: [] },
);

function link(parent, child, foreignKey, asParent, asChildren) {
  parent.hasMany(child, { foreignKey, as: asChildren });
  child.belongsTo(parent, { foreignKey, as: asParent });
}
link(Categoria, Producto, "categoria_id", "categoria", "productos");
link(Producto, Variante, "producto_id", "producto", "variantes");
Usuario.hasOne(Carrito, { foreignKey: "usuario_id", as: "carrito" });
Carrito.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
link(Carrito, CarritoItem, "carrito_id", "carrito", "items");
link(Variante, CarritoItem, "variante_id", "variante", "carritoItems");
link(Usuario, Pedido, "usuario_id", "usuario", "pedidos");
link(Pedido, PedidoItem, "pedido_id", "pedido", "items");
link(Variante, PedidoItem, "variante_id", "variante", "pedidoItems");
link(Variante, MovimientoInventario, "variante_id", "variante", "movimientos");
link(Usuario, MovimientoInventario, "usuario_id", "usuario", "movimientos");
link(Pedido, MovimientoInventario, "pedido_id", "pedido", "movimientos");
link(Pedido, HistorialEstadoPedido, "pedido_id", "pedido", "historial");
link(Usuario, HistorialEstadoPedido, "usuario_id", "usuario", "historial");
for (const model of Object.values(sequelize.models)) {
  if (!model.rawAttributes.actualizado_en) continue;
  model.addHook("beforeUpdate", (instance) => {
    instance.actualizado_en = new Date();
  });
  model.addHook("beforeBulkUpdate", (options) => {
    options.attributes.actualizado_en = new Date();
  });
}
