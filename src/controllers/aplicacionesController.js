const db = require("../config/database");
const {
  generateId,
  successResponse,
  errorResponse,
} = require("../utils/helpers");

const TIPOS_VALIDOS = [
  "fungicida",
  "insecticida",
  "biocontrol",
  "fertilizante",
  "enmienda",
];
const METODOS_VALIDOS = ["foliar", "suelo", "drench"];

const crear = async (req, res) => {
  try {
    const {
      producto,
      fecha,
      tipo,
      dosis,
      area_aplicada,
      metodo,
      siguiente_aplicacion,
      notas,
    } = req.body;

    if (!producto || !fecha || !tipo || !dosis || !metodo) {
      return errorResponse(
        res,
        "Campos requeridos: producto, fecha, tipo, dosis, metodo",
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

    if (!METODOS_VALIDOS.includes(metodo)) {
      return errorResponse(
        res,
        `Método no válido. Opciones: ${METODOS_VALIDOS.join(", ")}`,
        "INVALID_TYPE",
      );
    }

    const result = await db.query(
      `INSERT INTO aplicaciones
        (producto, fecha, tipo, dosis, area_aplicada, metodo, siguiente_aplicacion, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        producto,
        fecha,
        tipo,
        dosis,
        area_aplicada,
        metodo,
        siguiente_aplicacion,
        notas,
      ],
    );

    const registro = result.rows[0];
    const id_registro = generateId("APP", registro.id);
    await db.query("UPDATE aplicaciones SET id_registro = $1 WHERE id = $2", [
      id_registro,
      registro.id,
    ]);
    registro.id_registro = id_registro;
    registro.sync = { notion: false, sheets: false };

    return successResponse(res, registro, 201);
  } catch (error) {
    console.error("Error creando aplicación:", error.message);
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
      producto,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = "SELECT * FROM aplicaciones WHERE 1=1";
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
    if (producto) {
      p++;
      query += ` AND producto ILIKE $${p}`;
      params.push(`%${producto}%`);
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
    console.error("Error listando aplicaciones:", error.message);
    return errorResponse(
      res,
      "Error interno del servidor",
      "INTERNAL_ERROR",
      500,
    );
  }
};

module.exports = { crear, listar };
