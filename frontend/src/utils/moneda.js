export const moneda = (importe) => `Q ${Number(importe).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
