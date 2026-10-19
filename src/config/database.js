'use strict';

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const isSqlite =
  process.env.DB_DIALECT === 'sqlite' ||
  !process.env.DB_PASSWORD ||
  process.env.DB_PASSWORD === 'your_password_here';

let sequelize;

if (isSqlite) {
  const storagePath = path.resolve(__dirname, '../../database.sqlite');
  console.log(`[Database] Usando SQLite local: ${storagePath} (Para usar PostgreSQL, configura DB_PASSWORD en .env)`);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.NODE_ENV === 'development' ? false : false,
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'kdice_english',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        underscored: true,
        timestamps: true,
        paranoid: true,
      },
    }
  );
}

module.exports = sequelize;
