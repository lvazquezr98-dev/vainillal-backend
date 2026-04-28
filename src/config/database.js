// ============================================
// CONFIGURACIÓN DE BASE DE DATOS (PostgreSQL)
// ============================================
// Este archivo crea la conexión con PostgreSQL.
// Usa un "Pool" que mantiene varias conexiones abiertas
// para que las consultas sean más rápidas.

const { Pool } = require("pg");
require("dotenv").config();

// El Pool maneja automáticamente abrir y cerrar conexiones.
// En vez de conectarte cada vez que necesitas algo,
// el Pool tiene conexiones "listas para usar".
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Verificar que la conexión funcione al arrancar
pool.on("connect", () => {
  console.log("✅ Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Error en PostgreSQL:", err.message);
});

// Exportamos una función "query" que cualquier parte
// del código puede usar para hablar con la base de datos.
// Ejemplo de uso: const result = await db.query('SELECT * FROM bitacora');
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
