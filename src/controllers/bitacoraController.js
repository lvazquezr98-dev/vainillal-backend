const db = require("../config/database");
const {
  generateId,
  successResponse,
  errorResponse,
} = require("../utils/helpers");
const alertEngine = require("../services/alertEngine");

const TIPOS_VALIDOS = [
  "polinización",
  "manejo",
  "fitosanidad",
  "riego",
  "nutrición",
  "monitoreo",
  "infraestructura",
];

const crear = async (req, res) => {
  try {
    const {
      actividad,
      fecha,
      tipo,
      descripcion,
      datos_numericos,
      unidad,
      seccion_parcela,
      registrado_por,
    } = req.body;

    if (!actividad || !fecha || !tipo || !registrado_por) {
      return errorResponse(
        res,
        "Campos requeridos: actividad, fecha, tipo, registrado_por",
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

    const fechaObj = new Date(fecha + "T12:00:00Z");
    const inicioAnio = new Date(fechaObj.getFullYear(), 0, 1);
    const semana = Math.ceil(
      ((fechaObj - inicioAnio) / 86400000 + inicioAnio.getDay() + 1) / 7,
    );
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const mes = meses[fechaObj.getMonth()];

    const result = await db.query(
      `INSERT INTO bitacora
        (actividad, fecha, tipo, descripcion, datos_numericos,
         unidad, seccion_parcela, registrado_por, semana, mes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        actividad,
        fecha,
        tipo,
        descripcion,
        datos_numericos,
        unidad,
        seccion_parcela,
        registrado_por,
        semana,
        mes,
      ],
    );

    const registro = result.rows[0];
    const id_registro = generateId("BIT", registro.id);
    await db.query("UPDATE bitacora SET id_registro = $1 WHERE id = $2", [
      id_registro,
      registro.id,
    ]);
    registro.id_registro = id_registro;

    // ── MOTOR DE ALERTAS ──
    let alertas_generadas = [];
    try {
      alertas_generadas = await alertEngine.evaluarBitacora(registro);
    } catch (alertError) {
      console.error(
        "[Bitácora] Error en motor de alertas:",
        alertError.message,
      );
    }

    registro.sync = { notion: false, sheets: false };
    registro.alertas_generadas = alertas_generadas;

    return successResponse(res, registro, 201);
  } catch (error) {
    console.error("Error creando registro de bitácora:", error.message);
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
      fecha_inicio,
      fecha_fin,
      tipo,
      semana,
      mes,
      registrado_por,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = "SELECT * FROM bitacora WHERE 1=1";
    const params = [];
    let p = 0;

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
    if (tipo) {
      p++;
      query += ` AND tipo = $${p}`;
      params.push(tipo);
    }
    if (semana) {
      p++;
      query += ` AND semana = $${p}`;
      params.push(parseInt(semana));
    }
    if (mes) {
      p++;
      query += ` AND LOWER(mes) = LOWER($${p})`;
      params.push(mes);
    }
    if (registrado_por) {
      p++;
      query += ` AND registrado_por = $${p}`;
      params.push(registrado_por);
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
    console.error("Error listando bitácora:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM bitacora WHERE id = $1 OR id_registro = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, "Registro no encontrado", "NOT_FOUND", 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo registro:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { crear, listar, obtenerPorId };
