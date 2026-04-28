const db = require("../config/database");
const { successResponse, errorResponse } = require("../utils/helpers");

const obtenerPorSemana = async (req, res) => {
  try {
    const { semana } = req.params;

    const result = await db.query(
      "SELECT * FROM kpis_semanales WHERE semana = $1",
      [parseInt(semana)],
    );

    if (result.rows.length === 0) {
      return errorResponse(
        res,
        `No hay KPIs para la semana ${semana}`,
        "NOT_FOUND",
        404,
      );
    }

    const anterior = await db.query(
      "SELECT * FROM kpis_semanales WHERE semana = $1",
      [parseInt(semana) - 1],
    );

    const kpi = result.rows[0];
    let comparacion = null;

    if (anterior.rows.length > 0) {
      const ant = anterior.rows[0];
      comparacion = {
        amarre:
          parseFloat(kpi.amarre_porcentaje || 0) -
          parseFloat(ant.amarre_porcentaje || 0),
        fusarium: (kpi.plantas_fusarium || 0) - (ant.plantas_fusarium || 0),
        precipitacion:
          parseFloat(kpi.precipitacion_acumulada_mm || 0) -
          parseFloat(ant.precipitacion_acumulada_mm || 0),
      };
    }

    return successResponse(res, {
      ...kpi,
      comparacion_semana_anterior: comparacion,
    });
  } catch (error) {
    console.error("Error obteniendo KPIs:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const resumenMensual = async (req, res) => {
  try {
    const { mes } = req.params;

    const result = await db.query(
      "SELECT * FROM kpis_semanales WHERE LOWER(mes) = LOWER($1) ORDER BY semana",
      [mes],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, `No hay KPIs para ${mes}`, "NOT_FOUND", 404);
    }

    const semanas = result.rows;
    const resumen = {
      mes,
      semanas: semanas.length,
      promedio_amarre: (
        semanas.reduce((s, k) => s + parseFloat(k.amarre_porcentaje || 0), 0) /
        semanas.length
      ).toFixed(1),
      total_racimos: semanas.reduce(
        (s, k) => s + (k.racimos_polinizados || 0),
        0,
      ),
      promedio_fusarium: (
        semanas.reduce((s, k) => s + (k.plantas_fusarium || 0), 0) /
        semanas.length
      ).toFixed(1),
      precipitacion_total: semanas
        .reduce((s, k) => s + parseFloat(k.precipitacion_acumulada_mm || 0), 0)
        .toFixed(1),
      detalle_semanal: semanas,
    };

    return successResponse(res, resumen);
  } catch (error) {
    console.error("Error obteniendo resumen mensual:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { obtenerPorSemana, resumenMensual };
