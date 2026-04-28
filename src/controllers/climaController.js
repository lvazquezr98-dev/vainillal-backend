const db = require("../config/database");
const {
  generateId,
  successResponse,
  errorResponse,
} = require("../utils/helpers");
const alertEngine = require("../services/alertEngine");

const registrar = async (req, res) => {
  try {
    const {
      fecha_hora,
      temperatura_c,
      sensacion_termica_c,
      humedad_relativa,
      precipitacion_mm,
      viento_kmh,
      condicion,
      fuente = "manual",
    } = req.body;

    if (
      !fecha_hora ||
      temperatura_c === undefined ||
      humedad_relativa === undefined
    ) {
      return errorResponse(
        res,
        "Campos requeridos: fecha_hora, temperatura_c, humedad_relativa",
        "VALIDATION_ERROR",
      );
    }

    const result = await db.query(
      `INSERT INTO clima
        (fecha_hora, temperatura_c, sensacion_termica_c,
         humedad_relativa, precipitacion_mm, viento_kmh,
         condicion, fuente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        fecha_hora,
        temperatura_c,
        sensacion_termica_c,
        humedad_relativa,
        precipitacion_mm || 0,
        viento_kmh,
        condicion,
        fuente,
      ],
    );

    const registro = result.rows[0];
    const id_registro = generateId("CLM", registro.id);
    await db.query("UPDATE clima SET id_registro = $1 WHERE id = $2", [
      id_registro,
      registro.id,
    ]);
    registro.id_registro = id_registro;

    // ── MOTOR DE ALERTAS ──
    let alertas_generadas = [];
    try {
      alertas_generadas = await alertEngine.evaluarClima();
    } catch (alertError) {
      console.error("[Clima] Error en motor de alertas:", alertError.message);
    }

    registro.sync = { notion: false, sheets: false };
    registro.alertas_generadas = alertas_generadas;

    return successResponse(res, registro, 201);
  } catch (error) {
    console.error("Error registrando clima:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

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

    let alertas_activas = [];
    try {
      const resumen = await alertEngine.resumenAlertas();
      alertas_activas = resumen.alertas.filter((a) =>
        [
          "sequia",
          "sequia_critica",
          "humedad_alta",
          "temperatura_extrema",
        ].includes(a.tipo),
      );
    } catch (e) {
      /* no bloquear */
    }

    return successResponse(res, {
      ...registro,
      ultima_actualizacion: registro.fecha_hora,
      alertas_clima: alertas_activas,
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
        temp_max: Math.max(
          ...registros.map((r) => parseFloat(r.temperatura_c || 0)),
        ).toFixed(1),
        temp_min: Math.min(
          ...registros.map((r) => parseFloat(r.temperatura_c || 0)),
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

module.exports = { registrar, actual, historial };
