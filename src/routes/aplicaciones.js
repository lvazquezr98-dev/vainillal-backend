const express = require("express");
const router = express.Router();
const c = require("../controllers/aplicacionesController");

router.post("/", c.crear);
router.get("/", c.listar);

module.exports = router;
