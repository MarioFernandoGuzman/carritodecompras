import { Op } from "sequelize";
export const plain = (value) =>
  value?.get ? value.get({ plain: true }) : value;
export const options = (transaction, lock = false) => ({
  transaction: transaction || undefined,
  ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
});
export const contains = (value) => ({
  [Op.like]: `%${(value || "").replace(/[\\%_]/g, "\\$&")}%`,
});
export const categoryJoin = { association: "categoria", required: true };
export const productJoin = {
  association: "producto",
  required: true,
  include: [categoryJoin],
};
export function productRow(value) {
  const { categoria, ...row } = plain(value);
  return {
    ...row,
    categoria_id: categoria.id,
    categoria_nombre: categoria.nombre,
    categoria_slug: categoria.slug,
  };
}
