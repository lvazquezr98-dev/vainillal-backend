const express = require("express");
const router = express.Router();
const c = require("../controllers/alertasController");

router.get("/", c.listar);
router.get("/resumen", c.resumen); // NUEVO
router.post("/evaluar", c.evaluar); // NUEVO
router.put("/:id", c.resolver);

module.exports = router;
