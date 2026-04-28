// ============================================
// CONTROLLER DE BITÁCORA
// ============================================
// Aquí vive la LÓGICA de cada endpoint de bitácora.
// El controller recibe el request, valida los datos,
// habla con la base de datos, y devuelve la respuesta.

const db = require("../config/database");
const {
  generateId,
  getWeekNumber,
  getMonthName,
  successResponse,
  errorResponse,
} = require("../utils/helpers");

// Tipos válidos de actividad (los mismos que definimos en Notion)
const TIPOS_VALIDOS = [
  "polinización",
  "manejo",
  "fitosanidad",
  "riego",
  "nutrición",
  "monitoreo",
  "infraestructura",
];

const REGISTRADO_POR_VALIDOS = ["CEO", "Líder de campo", "Sistema"];

// === POST /bitacora — Crear un registro ===
const crear = async (req, res) => {
  try {
    // 1. Extraer datos del body
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

    // 2. Validar campos requeridos
    if (!actividad || !fecha || !tipo || !registrado_por) {
      return errorResponse(
        res,
        "Campos requeridos: actividad, fecha, tipo, registrado_por",
        "VALIDATION_ERROR",
      );
    }

    // 3. Validar que el tipo sea válido
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return errorResponse(
        res,
        `Tipo no válido. Opciones: ${TIPOS_VALIDOS.join(", ")}`,
        "INVALID_TYPE",
      );
    }

    // 4. Validar que registrado_por sea válido
    if (!REGISTRADO_POR_VALIDOS.includes(registrado_por)) {
      return errorResponse(
        res,
        `Registrado por no válido. Opciones: ${REGISTRADO_POR_VALIDOS.join(", ")}`,
        "INVALID_TYPE",
      );
    }

    // 5. Calcular semana y mes automáticamente
    const semana = getWeekNumber(fecha);
    const mes = getMonthName(fecha);

    // 6. Insertar en PostgreSQL
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

    // 7. Generar el ID legible (BIT-001, BIT-002, etc.)
    const registro = result.rows[0];
    const id_registro = generateId("BIT", registro.id);

    // 8. Actualizar el registro con el ID legible
    await db.query("UPDATE bitacora SET id_registro = $1 WHERE id = $2", [
      id_registro,
      registro.id,
    ]);

    registro.id_registro = id_registro;

    // 9. TODO: Sincronizar a Notion y Google Sheets (se agrega después)
    registro.sync = { notion: false, sheets: false };

    // 10. Responder con éxito
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

// === GET /bitacora — Listar registros con filtros ===
const listar = async (req, res) => {
  try {
    // Extraer query parameters con valores por defecto
    const {
      fecha_inicio,
      fecha_fin,
      tipo,
      semana,
      limit = 50,
      offset = 0,
    } = req.query;

    // Construir la query dinámicamente según los filtros
    let query = "SELECT * FROM bitacora WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (fecha_inicio) {
      paramCount++;
      query += ` AND fecha >= $${paramCount}`;
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      query += ` AND fecha <= $${paramCount}`;
      params.push(fecha_fin);
    }

    if (tipo) {
      paramCount++;
      query += ` AND tipo = $${paramCount}`;
      params.push(tipo);
    }

    if (semana) {
      paramCount++;
      query += ` AND semana = $${paramCount}`;
      params.push(parseInt(semana));
    }

    // Ordenar por fecha más reciente primero
    query += " ORDER BY fecha DESC, created_at DESC";

    // Agregar paginación
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await db.query(query, params);

    // Contar total (sin paginación) para informar al frontend
    let countQuery = "SELECT COUNT(*) FROM bitacora WHERE 1=1";
    const countParams = [];
    let countParamNum = 0;

    if (fecha_inicio) {
      countParamNum++;
      countQuery += ` AND fecha >= $${countParamNum}`;
      countParams.push(fecha_inicio);
    }
    if (fecha_fin) {
      countParamNum++;
      countQuery += ` AND fecha <= $${countParamNum}`;
      countParams.push(fecha_fin);
    }
    if (tipo) {
      countParamNum++;
      countQuery += ` AND tipo = $${countParamNum}`;
      countParams.push(tipo);
    }
    if (semana) {
      countParamNum++;
      countQuery += ` AND semana = $${countParamNum}`;
      countParams.push(parseInt(semana));
    }

    const countResult = await db.query(countQuery, countParams);

    return successResponse(res, {
      registros: result.rows,
      total: parseInt(countResult.rows[0].count),
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

// === GET /bitacora/:id — Obtener un registro por ID ===
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query("SELECT * FROM bitacora WHERE id = $1", [id]);

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
