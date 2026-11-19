import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'miniproyecto2';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '1234';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

/**
 * Inicializa la base de datos en MySQL ejecutando CREATE DATABASE IF NOT EXISTS
 * antes de que Sequelize intente autenticarse.
 */
export async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.end();
    console.log(`[Database] Base de datos '${dbName}' verificada/creada exitosamente.`);
  } catch (error) {
    console.error(`[Database Error] Error al verificar/crear la base de datos '${dbName}':`, error.message);
    throw error;
  }
}

/**
 * Instancia de Sequelize configurada para conectarse a la base de datos MySQL.
 */
export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
