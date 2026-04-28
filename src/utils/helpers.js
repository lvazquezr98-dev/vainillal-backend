// ============================================
// FUNCIONES AUXILIARES REUTILIZABLES
// ============================================
// Estas funciones se usan en todos los controllers.
// Centralizarlas aquí evita repetir código.

// Genera un ID legible como "BIT-001", "APP-012", "INC-003"
// Recibe el prefijo ("BIT", "APP", etc.) y el número secuencial
const generateId = (prefix, number) => {
  return `${prefix}-${String(number).padStart(3, "0")}`;
};

// Calcula el número de semana del año a partir de una fecha
// Ejemplo: "2026-04-28" → semana 18
const getWeekNumber = (dateString) => {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const oneWeek = 604800000; // milisegundos en una semana
  return Math.ceil(diff / oneWeek + 1);
};

// Obtiene el nombre del mes en español a partir de una fecha
// Ejemplo: "2026-04-28" → "abril"
const getMonthName = (dateString) => {
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
  const date = new Date(dateString);
  return meses[date.getMonth()];
};

// Respuesta de éxito estandarizada
// Todos los endpoints responden con el mismo formato
const successResponse = (res, data, status = 200) => {
  return res.status(status).json({
    ok: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Respuesta de error estandarizada
const errorResponse = (res, error, code, status = 400) => {
  return res.status(status).json({
    ok: false,
    error,
    code,
    status,
  });
};

module.exports = {
  generateId,
  getWeekNumber,
  getMonthName,
  successResponse,
  errorResponse,
};
