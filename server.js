// ============================================
// SERVIDOR PRINCIPAL — VAINILLAL BACKEND
// ============================================
// Este es el punto de entrada de toda la aplicación.
// Aquí se configura Express, se conectan los middleware,
// se registran las rutas, y se arranca el servidor.

const express = require("express");
const cors = require("cors");
const env = require("./src/config/env");
const authMiddleware = require("./src/middleware/auth");
const initDB = require("./src/config/initDB");

// Crear la aplicación Express
const app = express();

// === MIDDLEWARE GLOBALES ===

// cors() permite que el dashboard (que vive en otro dominio)
// pueda hacer requests a esta API. Sin esto, el browser
// bloquea las peticiones por seguridad.
app.use(cors());

// express.json() permite que Express entienda el body
// de las requests que vienen en formato JSON.
// Sin esto, req.body sería undefined.
app.use(express.json());

// Nuestro middleware de autenticación — verifica la API key
// en CADA request (excepto /health).
app.use(authMiddleware);

// === RUTAS ===

// Endpoint de salud — verificar que el servidor está vivo
app.get("/api/v1/health", (req, res) => {
  res.json({
    ok: true,
    data: {
      status: "operational",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
  });
});

// Aquí iremos agregando las rutas conforme las creemos:
app.use("/api/v1/bitacora", require("./src/routes/bitacora"));
// app.use('/api/v1/aplicaciones', require('./src/routes/aplicaciones'));
// app.use('/api/v1/incidencias', require('./src/routes/incidencias'));
// app.use('/api/v1/clima', require('./src/routes/clima'));
// app.use('/api/v1/alertas', require('./src/routes/alertas'));
// app.use('/api/v1/plan', require('./src/routes/plan'));
// app.use('/api/v1/kpis', require('./src/routes/kpis'));
// app.use('/api/v1/analizar', require('./src/routes/analizar'));

// === MANEJO DE RUTAS NO ENCONTRADAS ===
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Ruta ${req.originalUrl} no encontrada`,
    code: "NOT_FOUND",
    status: 404,
  });
});

// === ARRANCAR SERVIDOR ===
// Inicializar base de datos (crear tablas si no existen)
initDB();
app.listen(env.PORT, () => {
  console.log("");
  console.log("🌱 Vainillal Backend v1.0.0");
  console.log(`📡 Servidor corriendo en http://localhost:${env.PORT}`);
  console.log(`🔒 Modo: ${env.NODE_ENV}`);
  console.log("");
});
