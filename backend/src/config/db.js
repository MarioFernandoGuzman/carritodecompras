import { Sequelize } from "sequelize";
import { env } from "./env.js";
export const sequelize = new Sequelize(
  env.DB_NAME,
  env.DB_USER,
  env.DB_PASSWORD,
  {
    dialect: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    logging: false,
    timezone: "-06:00",
    pool: { max: 10, min: 0, acquire: 10000, idle: 10000 },
    dialectOptions: { connectTimeout: 5000, charset: "utf8mb4" },
    define: { freezeTableName: true, timestamps: false },
  },
);
