import { env } from './env.js';

export const COOKIE_SESION = 'visera_sesion';
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};
