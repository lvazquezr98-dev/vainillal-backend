const db = require("../config/database");
const {
  generateId,
  successResponse,
  errorResponse,
} = require("../utils/helpers");
const alertEngine = require("../services/alertEngine");

const TIPOS_VALIDOS = ["enfermedad", "plaga", "clima", "otro"];
const SEVERIDADES_VALIDAS = ["leve", "moderada", "grave"];
const ESTADOS_VALIDOS = ["activa", "controlada", "resuelta"];

const crear = async (req, res) => {
  try {
    const {
      incidencia,
      fecha,
      tipo,
      agente,
      severidad,
      ubicacion_parcela,
      plantas_afectadas,
      accion_tomada,
      estado,
    } = req.body;

    if (!incidencia || !fecha || !tipo || !severidad || !estado) {
      return errorResponse(
        res,
        "Campos requeridos: incidencia, fecha, tipo, severidad, estado",
        "VALIDATION_ERROR",
      );
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return errorResponse(
        res,
        `Tipo no válido. Opciones: ${TIPOS_VALIDOS.join(", ")}`,
        "INVALID_TYPE",
      );
    }
    if (!SEVERIDADES_VALIDAS.includes(severidad)) {
      return errorResponse(
        res,
        `Severidad no válida. Opciones: ${SEVERIDADES_VALIDAS.join(", ")}`,
        "INVALID_TYPE",
      );
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return errorResponse(
        res,
        `Estado no válido. Opciones: ${ESTADOS_VALIDOS.join(", ")}`,
        "INVALID_TYPE",
      );
    }

    const result = await db.query(
      `INSERT INTO incidencias
        (incidencia, fecha, tipo, agente, severidad,
         ubicacion_parcela, plantas_afectadas, accion_tomada, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        incidencia,
        fecha,
        tipo,
        agente,
        severidad,
        ubicacion_parcela,
        plantas_afectadas,
        accion_tomada,
        estado,
      ],
    );

    const registro = result.rows[0];
    const id_registro = generateId("INC", registro.id);
    await db.query("UPDATE incidencias SET id_registro = $1 WHERE id = $2", [
      id_registro,
      registro.id,
    ]);
    registro.id_registro = id_registro;

    // ── MOTOR DE ALERTAS ──
    let alertas_generadas = [];
    try {
      alertas_generadas = await alertEngine.evaluarIncidencia(registro);
    } catch (alertError) {
      console.error(
        "[Incidencias] Error en motor de alertas:",
        alertError.message,
      );
    }

    registro.sync = { notion: false, sheets: false };
    registro.alertas_generadas = alertas_generadas;

    return successResponse(res, registro, 201);
  } catch (error) {
    console.error("Error creando incidencia:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const listar = async (req, res) => {
  try {
    const {
      estado = "activa",
      tipo,
      severidad,
      fecha_inicio,
      fecha_fin,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = "SELECT * FROM incidencias WHERE 1=1";
    const params = [];
    let p = 0;

    if (estado && estado !== "todas") {
      p++;
      query += ` AND estado = $${p}`;
      params.push(estado);
    }
    if (tipo) {
      p++;
      query += ` AND tipo = $${p}`;
      params.push(tipo);
    }
    if (severidad) {
      p++;
      query += ` AND severidad = $${p}`;
      params.push(severidad);
    }
    if (fecha_inicio) {
      p++;
      query += ` AND fecha >= $${p}`;
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      p++;
      query += ` AND fecha <= $${p}`;
      params.push(fecha_fin);
    }

    query += " ORDER BY fecha DESC, created_at DESC";
    p++;
    query += ` LIMIT $${p}`;
    params.push(parseInt(limit));
    p++;
    query += ` OFFSET $${p}`;
    params.push(parseInt(offset));

    const result = await db.query(query, params);

    return successResponse(res, {
      registros: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error listando incidencias:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, accion_tomada } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return errorResponse(
        res,
        `Estado no válido. Opciones: ${ESTADOS_VALIDOS.join(", ")}`,
        "INVALID_TYPE",
      );
    }

    const result = await db.query(
      `UPDATE incidencias
       SET estado = $1, accion_tomada = COALESCE($2, accion_tomada)
       WHERE id = $3
       RETURNING *`,
      [estado, accion_tomada, id],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Incidencia no encontrada", "NOT_FOUND", 404);
    }

    const registro = result.rows[0];

    // Re-evaluar Fusarium si se resolvió una incidencia relacionada
    if (
      estado === "resuelta" &&
      registro.agente &&
      registro.agente.toLowerCase().includes("fusarium")
    ) {
      try {
        await alertEngine.evaluarIncidencia(registro);
      } catch (alertError) {
        console.error(
          "[Incidencias] Error re-evaluando alertas:",
          alertError.message,
        );
      }
    }

    return successResponse(res, registro);
  } catch (error) {
    console.error("Error actualizando incidencia:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { crear, listar, actualizarEstado };
