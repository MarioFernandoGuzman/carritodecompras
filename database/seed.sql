-- Ejecutar después de schema.sql en la base seleccionada.
START TRANSACTION;

INSERT INTO categorias (id, nombre, slug, descripcion) VALUES
  (1, 'Snapback', 'snapback', 'Visera plana y carácter urbano.'),
  (2, 'Dad Hat', 'dad-hat', 'Comodidad de todos los días.'),
  (3, 'Trucker', 'trucker', 'Malla ligera para salir a explorar.'),
  (4, 'Bucket & Beanie', 'bucket-beanie', 'Estilos para el sol y el frío.');

INSERT INTO productos (id, categoria_id, nombre, slug, descripcion, material, precio, destacado) VALUES
  (1, 1, 'Snapback Volcán', 'snapback-volcan', 'Visera plana y silueta firme para recorrer la ciudad.', 'Algodón twill', 179.00, 1),
  (2, 1, 'Snapback Zona Viva', 'snapback-zona-viva', 'Un acento de color para las noches de la capital.', 'Algodón y poliéster', 189.00, 0),
  (3, 1, 'Snapback Acatenango', 'snapback-acatenango', 'Líneas limpias inspiradas en el horizonte volcánico.', 'Algodón twill', 199.00, 0),
  (4, 2, 'Dad Hat Atitlán', 'dad-hat-atitlan', 'Una gorra suave para días tranquilos junto al lago.', 'Algodón lavado', 149.00, 1),
  (5, 2, 'Dad Hat Antigua', 'dad-hat-antigua', 'Textura relajada y tonos cálidos para caminar sin prisa.', 'Algodón lavado', 139.00, 0),
  (6, 2, 'Dad Hat Cobán', 'dad-hat-coban', 'Perfil bajo y colores del bosque para usar a diario.', 'Algodón orgánico', 159.00, 0),
  (7, 3, 'Trucker Quetzal', 'trucker-quetzal', 'Panel frontal firme y malla fresca para el camino.', 'Algodón y malla de poliéster', 169.00, 1),
  (8, 3, 'Trucker Pacífico', 'trucker-pacifico', 'Ligera y ventilada para tardes cerca del mar.', 'Malla trucker', 159.00, 0),
  (9, 3, 'Trucker Ruta Maya', 'trucker-ruta-maya', 'Comodidad para viajes largos y nuevas rutas.', 'Algodón y malla de poliéster', 179.00, 0),
  (10, 4, 'Bucket Tikal', 'bucket-tikal', 'Ala completa y tela ligera para explorar al sol.', 'Algodón canvas', 149.00, 1),
  (11, 4, 'Bucket Monterrico', 'bucket-monterrico', 'Una silueta relajada para los días de playa.', 'Algodón canvas', 139.00, 0),
  (12, 4, 'Beanie Cuchumatanes', 'beanie-cuchumatanes', 'Tejido cálido para el aire fresco de las montañas.', 'Tejido acrílico suave', 129.00, 0);

-- Tres colores por producto y dos tallas por color: 72 variantes.
INSERT INTO variantes (producto_id, sku, color_nombre, color_hex, talla, stock, stock_minimo)
SELECT p.id,
       CONCAT('VIS-', LPAD(p.id, 3, '0'), '-', colores.codigo, '-', tallas.codigo),
       colores.nombre,
       colores.hex,
       tallas.nombre,
       CASE
         WHEN p.id = 1 AND colores.codigo = 'NEG' AND tallas.codigo = 'SM' THEN 0
         WHEN p.id = 4 AND colores.codigo = 'JAD' AND tallas.codigo = 'LX' THEN 2
         WHEN p.id = 10 AND colores.codigo = 'ARE' AND tallas.codigo = 'SM' THEN 3
         ELSE 6 + MOD(p.id * colores.orden + tallas.orden, 19)
       END,
       3
FROM productos AS p
CROSS JOIN (
  SELECT 'NEG' AS codigo, 'Negro' AS nombre, '#14110F' AS hex, 1 AS orden
  UNION ALL SELECT 'JAD', 'Verde jade', '#1F6F54', 2
  UNION ALL SELECT 'ARE', 'Arena', '#D8C3A5', 3
) AS colores
CROSS JOIN (
  SELECT 'SM' AS codigo, 'S/M' AS nombre, 1 AS orden
  UNION ALL SELECT 'LX', 'L/XL', 2
) AS tallas
ORDER BY p.id, colores.orden, tallas.orden;

INSERT INTO movimientos_inventario (variante_id, tipo, cantidad, stock_resultante, motivo)
SELECT id, 'entrada', stock, stock, 'Inventario inicial de demostración'
FROM variantes
WHERE stock > 0;

COMMIT;
