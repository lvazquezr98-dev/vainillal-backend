// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
// Este middleware se ejecuta ANTES de cada endpoint protegido.
// Verifica que el request tenga un header X-API-Key válido.
// Si no lo tiene, rechaza el request con error 401.

const env = require("../config/env");

// Un middleware en Express es una función que recibe
// (req, res, next). Si todo está bien, llama a next()
// para continuar al endpoint. Si hay error, responde
// directamente y NO llama a next().
const authMiddleware = (req, res, next) => {
  // El endpoint /health no requiere autenticación
  if (req.path === "/api/v1/health") {
    return next();
  }

  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      ok: false,
      error: "API key no proporcionada",
      code: "AUTH_FAILED",
      status: 401,
    });
  }

  if (apiKey !== env.API_KEY) {
    return res.status(401).json({
      ok: false,
      error: "API key inválida",
      code: "AUTH_FAILED",
      status: 401,
    });
  }

  // API key válida — continuar al endpoint
  next();
};

module.exports = authMiddleware;
