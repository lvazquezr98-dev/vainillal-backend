const express = require("express");
const router = express.Router();
const c = require("../controllers/planController");

router.get("/:mes", c.obtenerPorMes);
router.get("/:mes/:semana", c.obtenerPorSemana);

module.exports = router;
