const express = require("express");
const router = express.Router();
const c = require("../controllers/climaController");

router.post("/", c.registrar); // NUEVO: registrar dato de clima
router.get("/actual", c.actual);
router.get("/historial", c.historial);

module.exports = router;
