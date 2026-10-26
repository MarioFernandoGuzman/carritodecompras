CREATE DATABASE IF NOT EXISTS gorras_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS gorras_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gorras_db;

-- Recreación de las tablas en orden de dependencias; elimina los datos anteriores.
DROP TABLE IF EXISTS historial_estado_pedido;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS pedido_items;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS carrito_items;
DROP TABLE IF EXISTS carritos;
DROP TABLE IF EXISTS variantes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NULL,
  rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT chk_usuarios_activo CHECK (activo IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre),
  CONSTRAINT uq_categorias_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  categoria_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  descripcion TEXT NULL,
  material VARCHAR(100) NULL,
  precio DECIMAL(10,2) NOT NULL,
  destacado TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_productos_slug UNIQUE (slug),
  INDEX idx_productos_categoria (categoria_id),
  INDEX idx_productos_activo_destacado (activo, destacado),
  FULLTEXT INDEX ft_productos_busqueda (nombre, descripcion),
  CONSTRAINT chk_productos_precio CHECK (precio >= 0),
  CONSTRAINT chk_productos_destacado CHECK (destacado IN (0, 1)),
  CONSTRAINT chk_productos_activo CHECK (activo IN (0, 1)),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE variantes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  sku VARCHAR(50) NOT NULL,
  color_nombre VARCHAR(40) NOT NULL,
  color_hex CHAR(7) NOT NULL,
  talla VARCHAR(20) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 3,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT uq_variantes_sku UNIQUE (sku),
  CONSTRAINT uq_variantes_producto_color_talla UNIQUE (producto_id, color_nombre, talla),
  CONSTRAINT chk_variantes_stock CHECK (stock >= 0),
  CONSTRAINT chk_variantes_stock_minimo CHECK (stock_minimo >= 0),
  CONSTRAINT chk_variantes_activo CHECK (activo IN (0, 1)),
  CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE carritos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_carritos_usuario UNIQUE (usuario_id),
  CONSTRAINT fk_carritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE carrito_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  carrito_id INT UNSIGNED NOT NULL,
  variante_id INT UNSIGNED NOT NULL,
  cantidad INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_carrito_items_carrito_variante UNIQUE (carrito_id, variante_id),
  CONSTRAINT chk_carrito_items_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_carrito_items_carrito FOREIGN KEY (carrito_id) REFERENCES carritos (id) ON DELETE CASCADE,
  CONSTRAINT fk_carrito_items_variante FOREIGN KEY (variante_id) REFERENCES variantes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedidos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  estado ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  subtotal DECIMAL(10,2) NOT NULL,
  envio DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  nombre_destinatario VARCHAR(100) NOT NULL,
  telefono_contacto VARCHAR(20) NOT NULL,
  direccion_envio VARCHAR(255) NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  notas VARCHAR(255) NULL,
  metodo_pago ENUM('tarjeta', 'contra_entrega') NOT NULL,
  pago_marca VARCHAR(20) NULL,
  pago_ultimos4 CHAR(4) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_pedidos_codigo UNIQUE (codigo),
  INDEX idx_pedidos_usuario (usuario_id),
  INDEX idx_pedidos_estado (estado),
  INDEX idx_pedidos_creado_en (creado_en),
  CONSTRAINT chk_pedidos_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_pedidos_envio CHECK (envio >= 0),
  CONSTRAINT chk_pedidos_total CHECK (total >= 0 AND total = subtotal + envio),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id INT UNSIGNED NOT NULL,
  variante_id INT UNSIGNED NOT NULL,
  nombre_producto VARCHAR(150) NOT NULL,
  color_nombre VARCHAR(40) NOT NULL,
  color_hex CHAR(7) NOT NULL,
  talla VARCHAR(20) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_pedido_items_precio CHECK (precio_unitario >= 0),
  CONSTRAINT chk_pedido_items_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_pedido_items_subtotal CHECK (subtotal >= 0 AND subtotal = precio_unitario * cantidad),
  CONSTRAINT fk_pedido_items_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_items_variante FOREIGN KEY (variante_id) REFERENCES variantes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimientos_inventario (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  variante_id INT UNSIGNED NOT NULL,
  tipo ENUM('entrada', 'salida_venta', 'ajuste', 'devolucion_cancelacion') NOT NULL,
  cantidad INT NOT NULL,
  stock_resultante INT NOT NULL,
  motivo VARCHAR(255) NULL,
  usuario_id INT UNSIGNED NULL,
  pedido_id INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_movimientos_stock CHECK (stock_resultante >= 0),
  CONSTRAINT fk_movimientos_variante FOREIGN KEY (variante_id) REFERENCES variantes (id),
  CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
  CONSTRAINT fk_movimientos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historial_estado_pedido (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id INT UNSIGNED NOT NULL,
  estado ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') NOT NULL,
  usuario_id INT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id),
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
