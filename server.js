const express = require("express");
const cors = require("cors");
const env = require("./src/config/env");
const authMiddleware = require("./src/middleware/auth");
const initDB = require("./src/config/initDB");

const app = express();

app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// === RUTAS ===
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

app.use("/api/v1/bitacora", require("./src/routes/bitacora"));
app.use("/api/v1/aplicaciones", require("./src/routes/aplicaciones"));
app.use("/api/v1/incidencias", require("./src/routes/incidencias"));
app.use("/api/v1/clima", require("./src/routes/clima"));
app.use("/api/v1/alertas", require("./src/routes/alertas"));
app.use("/api/v1/plan", require("./src/routes/plan"));
app.use("/api/v1/kpis", require("./src/routes/kpis"));

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Ruta ${req.originalUrl} no encontrada`,
    code: "NOT_FOUND",
    status: 404,
  });
});

initDB();

app.listen(env.PORT, () => {
  console.log("");
  console.log("🌱 Vainillal Backend v1.0.0");
  console.log(`📡 Servidor corriendo en http://localhost:${env.PORT}`);
  console.log(`🔒 Modo: ${env.NODE_ENV}`);
  console.log("");
});
