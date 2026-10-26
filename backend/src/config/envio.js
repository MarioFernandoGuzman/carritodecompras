export const TARIFA_ENVIO_CENTAVOS = 2500;
export const ENVIO_GRATIS_DESDE_CENTAVOS = 30000;

export const configuracionEnvio = () => ({
  tarifa: (TARIFA_ENVIO_CENTAVOS / 100).toFixed(2),
  gratisDesde: (ENVIO_GRATIS_DESDE_CENTAVOS / 100).toFixed(2),
});
