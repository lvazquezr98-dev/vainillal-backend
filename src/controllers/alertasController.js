const db = require("../config/database");
const { successResponse, errorResponse } = require("../utils/helpers");

const listar = async (req, res) => {
  try {
    const { estado = "activa" } = req.query;

    let query = "SELECT * FROM alertas";
    const params = [];

    if (estado && estado !== "todas") {
      query += " WHERE estado = $1";
      params.push(estado);
    }

    query += " ORDER BY created_at DESC";

    const result = await db.query(query, params);

    const activasResult = await db.query(
      "SELECT COUNT(*) FROM alertas WHERE estado = 'activa'",
    );

    return successResponse(res, {
      alertas: result.rows,
      total_activas: parseInt(activasResult.rows[0].count),
    });
  } catch (error) {
    console.error("Error listando alertas:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const resolver = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nota_resolucion } = req.body;

    if (!estado || !["activa", "resuelta"].includes(estado)) {
      return errorResponse(
        res,
        "Estado debe ser: activa o resuelta",
        "INVALID_TYPE",
      );
    }

    const resolved_at = estado === "resuelta" ? new Date().toISOString() : null;

    const result = await db.query(
      `UPDATE alertas
       SET estado = $1, nota_resolucion = $2, resolved_at = $3
       WHERE id = $4 RETURNING *`,
      [estado, nota_resolucion, resolved_at, id],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Alerta no encontrada", "NOT_FOUND", 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (error) {
    console.error("Error resolviendo alerta:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { listar, resolver };
