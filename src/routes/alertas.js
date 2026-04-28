const express = require("express");
const router = express.Router();
const c = require("../controllers/alertasController");

router.get("/", c.listar);
router.put("/:id", c.resolver);

module.exports = router;
