const lineas = (items) => items.map((item) => ({ ...item, subtotal: (Math.round(Number(item.precio_unitario) * 100) * item.cantidad / 100).toFixed(2) }));

export function calcularTotales(items) {
  return items.reduce((total, item) => ({
    subtotal: (Math.round(total.subtotal * 100) + Math.round(Number(item.precio_unitario) * 100) * item.cantidad) / 100,
    cantidadTotal: total.cantidadTotal + item.cantidad,
  }), { subtotal: 0, cantidadTotal: 0 });
}

export function cartReducer(items, action) {
  switch (action.type) {
    case 'hidratar': return lineas(action.items);
    case 'vaciar': return [];
    case 'eliminar': return items.filter((item) => item.varianteId !== action.varianteId);
    case 'modificar': return lineas(items.map((item) => item.varianteId === action.varianteId
      ? { ...item, cantidad: Math.max(1, Math.min(action.cantidad, item.stock)) } : item));
    case 'agregar': {
      const existente = items.find((item) => item.varianteId === action.item.varianteId);
      return lineas(existente ? items.map((item) => item === existente
        ? { ...item, ...action.item, cantidad: Math.min(item.cantidad + action.item.cantidad, action.item.stock) } : item)
        : [...items, { ...action.item, cantidad: Math.min(action.item.cantidad, action.item.stock) }]);
    }
    default: return items;
  }
}
