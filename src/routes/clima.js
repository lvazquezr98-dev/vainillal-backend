const express = require("express");
const router = express.Router();
const c = require("../controllers/climaController");

router.get("/actual", c.actual);
router.get("/historial", c.historial);

module.exports = router;
