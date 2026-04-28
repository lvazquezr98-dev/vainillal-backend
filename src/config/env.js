// ============================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// ============================================
// Este archivo verifica que todas las variables
// necesarias existan ANTES de arrancar el servidor.
// Si falta alguna, el servidor no arranca y te dice cuál falta.

require("dotenv").config();

const requiredVars = ["PORT", "DATABASE_URL", "API_KEY", "WEATHER_API_KEY"];

// Verificar que cada variable requerida exista
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error("❌ Faltan variables de entorno:");
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error("\nRevisa tu archivo .env");
  process.exit(1); // Detener el servidor
}

// Exportar las variables ya validadas para uso fácil
module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  API_KEY: process.env.API_KEY,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  WEATHER_LAT: process.env.WEATHER_LAT || "20.5295",
  WEATHER_LON: process.env.WEATHER_LON || "-97.459",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
};
