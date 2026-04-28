const db = require("../config/database");
const { successResponse, errorResponse } = require("../utils/helpers");

const actual = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM clima ORDER BY fecha_hora DESC LIMIT 1",
    );

    if (result.rows.length === 0) {
      return successResponse(res, {
        mensaje:
          "No hay datos de clima aún. El cron job los llenará automáticamente.",
        ultima_actualizacion: null,
      });
    }

    const registro = result.rows[0];
    return successResponse(res, {
      ...registro,
      ultima_actualizacion: registro.fecha_hora,
    });
  } catch (error) {
    console.error("Error obteniendo clima actual:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const historial = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      agrupacion = "registro",
      limit = 100,
    } = req.query;

    let query = "SELECT * FROM clima WHERE 1=1";
    const params = [];
    let p = 0;

    if (fecha_inicio) {
      p++;
      query += ` AND fecha_hora >= $${p}`;
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      p++;
      query += ` AND fecha_hora <= $${p}`;
      params.push(fecha_fin);
    }

    query += " ORDER BY fecha_hora DESC";
    p++;
    query += ` LIMIT $${p}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    if (agrupacion === "diario" && result.rows.length > 0) {
      const porDia = {};
      result.rows.forEach((r) => {
        const dia = r.fecha_hora.toISOString().split("T")[0];
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push(r);
      });

      const resumenDiario = Object.entries(porDia).map(([dia, registros]) => ({
        fecha: dia,
        temp_promedio: (
          registros.reduce((s, r) => s + parseFloat(r.temperatura_c || 0), 0) /
          registros.length
        ).toFixed(1),
        humedad_promedio: (
          registros.reduce(
            (s, r) => s + parseFloat(r.humedad_relativa || 0),
            0,
          ) / registros.length
        ).toFixed(1),
        precipitacion_total: registros
          .reduce((s, r) => s + parseFloat(r.precipitacion_mm || 0), 0)
          .toFixed(1),
        registros: registros.length,
      }));

      return successResponse(res, {
        registros: resumenDiario,
        agrupacion: "diario",
      });
    }

    return successResponse(res, {
      registros: result.rows,
      total: result.rows.length,
      agrupacion,
    });
  } catch (error) {
    console.error("Error obteniendo historial de clima:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { actual, historial };
