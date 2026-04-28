const express = require("express");
const router = express.Router();
const c = require("../controllers/kpisController");

router.get("/resumen/:mes", c.resumenMensual);
router.get("/:semana", c.obtenerPorSemana);

module.exports = router;
