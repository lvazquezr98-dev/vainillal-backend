const db = require("../config/database");
const { successResponse, errorResponse } = require("../utils/helpers");

const obtenerPorMes = async (req, res) => {
  try {
    const { mes } = req.params;

    const result = await db.query(
      "SELECT * FROM plan_operativo WHERE LOWER(mes) = LOWER($1) ORDER BY semana, prioridad",
      [mes],
    );

    const total = result.rows.length;
    const completadas = result.rows.filter(
      (t) => t.estado === "completada",
    ).length;
    const enCurso = result.rows.filter((t) => t.estado === "en curso").length;
    const pendientes = result.rows.filter(
      (t) => t.estado === "pendiente",
    ).length;

    return successResponse(res, {
      mes,
      tareas: result.rows,
      resumen: {
        total,
        completadas,
        en_curso: enCurso,
        pendientes,
        porcentaje_avance:
          total > 0 ? Math.round((completadas / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error obteniendo plan:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const obtenerPorSemana = async (req, res) => {
  try {
    const { mes, semana } = req.params;

    const result = await db.query(
      "SELECT * FROM plan_operativo WHERE LOWER(mes) = LOWER($1) AND semana = $2 ORDER BY prioridad",
      [mes, parseInt(semana)],
    );

    return successResponse(res, {
      mes,
      semana: parseInt(semana),
      tareas: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo plan semanal:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { obtenerPorMes, obtenerPorSemana };
