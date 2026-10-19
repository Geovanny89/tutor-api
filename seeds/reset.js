'use strict';

/**
 * Reset de base de datos (acción puntual).
 *
 * Elimina y recrea TODAS las tablas con un "force sync" y deja la BD vacía.
 * Se combina con el seed para volver a cargar tenant + currículo + admin:
 *
 *    npm run db:reset
 *
 * ⚠️  DESTRUCTIVO: borra usuarios, progreso, uso de IA y todo el contenido.
 *     No lo uses en producción salvo que sea intencional.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize } = require('../src/models');

async function reset() {
  try {
    console.log('⚠️  Reset total: se eliminarán TODAS las tablas y sus datos...');
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos reiniciada (tablas recreadas vacías)');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Reset falló:', error.message);
    process.exit(1);
  }
}

reset();
