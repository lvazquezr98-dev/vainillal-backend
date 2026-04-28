const express = require("express");
const router = express.Router();
const c = require("../controllers/incidenciasController");

router.post("/", c.crear);
router.get("/", c.listar);
router.put("/:id", c.actualizarEstado);

module.exports = router;
