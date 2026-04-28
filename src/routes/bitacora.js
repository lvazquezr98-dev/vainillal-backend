// ============================================
// RUTAS DE BITÁCORA
// ============================================
// Este archivo define las URLs y métodos HTTP
// que activan cada función del controller.
// Es como el "menú" del restaurante — mapea
// cada platillo (endpoint) con su chef (controller).

const express = require("express");
const router = express.Router();
const bitacoraController = require("../controllers/bitacoraController");

// POST /api/v1/bitacora → crear un registro
router.post("/", bitacoraController.crear);

// GET /api/v1/bitacora → listar registros con filtros
router.get("/", bitacoraController.listar);

// GET /api/v1/bitacora/:id → obtener un registro por ID
router.get("/:id", bitacoraController.obtenerPorId);

module.exports = router;
