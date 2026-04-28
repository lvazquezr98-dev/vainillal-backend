// ============================================================
// MOTOR DE ALERTAS — Vainillal Miguel Hidalgo
// ============================================================
// Evalúa 6 umbrales automáticamente cada vez que entra un dato
// nuevo de clima, bitácora o incidencia.
//
// Umbrales definidos en Arquitectura_del_Sistema_v1:
//   1. Sequía:              días sin lluvia > 4   → Alta
//   2. Sequía crítica:      días sin lluvia > 7   → Crítica
//   3. Humedad alta:        humedad > 85% × 3 días → Media
//   4. Fusarium:            plantas > 5% del total → Crítica
//   5. Amarre bajo:         amarre < 70%           → Alta
//   6. Temperatura extrema: temp > 38°C            → Media
// ============================================================

const db = require("../config/database");
const { generateId } = require("../utils/helpers");

// ── Configuración de umbrales ────────────────────────────────
const TOTAL_PLANTAS = 4000; // ~4,000 esquejes/ha (Plan Maestro)

const UMBRALES = {
  sequia: {
    tipo: "sequia",
    severidad: "alta",
    limite: 4,
    mensaje: (valor) =>
      `⚠️ Sequía: ${valor} días consecutivos sin lluvia. El riego de auxilio es necesario para evitar estrés hídrico y pérdida de frutos.`,
    umbral_texto: "dias_sin_lluvia > 4",
  },
  sequia_critica: {
    tipo: "sequia_critica",
    severidad: "critica",
    limite: 7,
    mensaje: (valor) =>
      `🚨 Sequía CRÍTICA: ${valor} días consecutivos sin lluvia. Riesgo severo de quemaduras en tallos, caída de frutos y aborto de flores. Riego URGENTE.`,
    umbral_texto: "dias_sin_lluvia > 7",
  },
  humedad_alta: {
    tipo: "humedad_alta",
    severidad: "media",
    limite: 85,
    dias_consecutivos: 3,
    mensaje: (valor) =>
      `💧 Humedad alta sostenida: ${valor}% promedio por 3+ días. Condiciones favorables para Fusarium oxysporum. Reforzar programa de fungicidas y verificar drenaje.`,
    umbral_texto: "humedad_relativa > 85% por 3 dias consecutivos",
  },
  fusarium: {
    tipo: "fusarium",
    severidad: "critica",
    limite: 5,
    mensaje: (valor) =>
      `🚨 Fusarium CRÍTICO: ${valor}% de plantas afectadas (${Math.round((valor * TOTAL_PLANTAS) / 100)} de ${TOTAL_PLANTAS}). Saneamiento inmediato, quemar tejidos, desinfectar herramientas. Aplicar Trichoderma + Bacillus.`,
    umbral_texto: "plantas_fusarium > 5% del total",
  },
  amarre_bajo: {
    tipo: "amarre_bajo",
    severidad: "alta",
    limite: 70,
    mensaje: (valor) =>
      `⚠️ Amarre bajo: ${valor}% (meta: ≥70%). Evaluar: ¿riego insuficiente? ¿polinización en horas inadecuadas? ¿lluvia durante polinización? Cada punto perdido son ~${Math.round(TOTAL_PLANTAS * 0.05)} frutos menos.`,
    umbral_texto: "amarre_porcentaje < 70%",
  },
  temperatura_extrema: {
    tipo: "temperatura_extrema",
    severidad: "media",
    limite: 38,
    mensaje: (valor) =>
      `🌡️ Temperatura extrema: ${valor}°C registrados. Riesgo de quemaduras foliares y estrés térmico. Verificar que la sombra sea ≥50%. Considerar riego por aspersión para enfriar microambiente.`,
    umbral_texto: "temperatura > 38°C",
  },
};

// ── Función principal: evaluar después de dato de clima ──────
async function evaluarClima() {
  const alertasGeneradas = [];

  try {
    const sequia = await evaluarSequia();
    if (sequia) alertasGeneradas.push(sequia);

    const sequiaCritica = await evaluarSequiaCritica();
    if (sequiaCritica) alertasGeneradas.push(sequiaCritica);

    const humedad = await evaluarHumedadAlta();
    if (humedad) alertasGeneradas.push(humedad);

    const temp = await evaluarTemperaturaExtrema();
    if (temp) alertasGeneradas.push(temp);
  } catch (error) {
    console.error("[AlertEngine] Error evaluando clima:", error.message);
  }

  return alertasGeneradas;
}

// ── Función principal: evaluar después de dato de bitácora ───
async function evaluarBitacora(registro) {
  const alertasGeneradas = [];

  try {
    if (registro.tipo === "polinización") {
      const amarre = await evaluarAmarreBajo();
      if (amarre) alertasGeneradas.push(amarre);
    }

    if (["fitosanidad", "monitoreo"].includes(registro.tipo)) {
      const fusarium = await evaluarFusarium();
      if (fusarium) alertasGeneradas.push(fusarium);
    }
  } catch (error) {
    console.error("[AlertEngine] Error evaluando bitácora:", error.message);
  }

  return alertasGeneradas;
}

// ── Función principal: evaluar después de incidencia ─────────
async function evaluarIncidencia(registro) {
  const alertasGeneradas = [];

  try {
    if (
      registro.tipo === "enfermedad" &&
      registro.agente &&
      registro.agente.toLowerCase().includes("fusarium")
    ) {
      const fusarium = await evaluarFusarium();
      if (fusarium) alertasGeneradas.push(fusarium);
    }
  } catch (error) {
    console.error("[AlertEngine] Error evaluando incidencia:", error.message);
  }

  return alertasGeneradas;
}

// ── Evaluadores individuales ─────────────────────────────────

async function evaluarSequia() {
  const diasResult = await db.query(`
    SELECT
      CASE
        WHEN MAX(DATE(fecha_hora)) IS NULL THEN 0
        ELSE CURRENT_DATE - MAX(DATE(fecha_hora))
      END as dias_sin_lluvia
    FROM clima
    WHERE precipitacion_mm > 0
  `);

  const diasSinLluvia = parseInt(diasResult.rows[0]?.dias_sin_lluvia || 0);

  if (
    diasSinLluvia > UMBRALES.sequia.limite &&
    diasSinLluvia <= UMBRALES.sequia_critica.limite
  ) {
    return await crearAlertaSiNoExiste(UMBRALES.sequia, diasSinLluvia);
  }

  if (diasSinLluvia <= UMBRALES.sequia.limite) {
    await autoResolverAlerta(
      "sequia",
      `Lluvia registrada. Días sin lluvia: ${diasSinLluvia}`,
    );
  }

  return null;
}

async function evaluarSequiaCritica() {
  const diasResult = await db.query(`
    SELECT
      CASE
        WHEN MAX(DATE(fecha_hora)) IS NULL THEN 0
        ELSE CURRENT_DATE - MAX(DATE(fecha_hora))
      END as dias_sin_lluvia
    FROM clima
    WHERE precipitacion_mm > 0
  `);

  const diasSinLluvia = parseInt(diasResult.rows[0]?.dias_sin_lluvia || 0);

  if (diasSinLluvia > UMBRALES.sequia_critica.limite) {
    return await crearAlertaSiNoExiste(UMBRALES.sequia_critica, diasSinLluvia);
  }

  if (diasSinLluvia <= UMBRALES.sequia_critica.limite) {
    await autoResolverAlerta(
      "sequia_critica",
      `Lluvia registrada. Días sin lluvia: ${diasSinLluvia}`,
    );
  }

  return null;
}

async function evaluarHumedadAlta() {
  const result = await db.query(
    `
    SELECT
      DATE(fecha_hora) as dia,
      AVG(humedad_relativa) as humedad_promedio
    FROM clima
    WHERE fecha_hora >= CURRENT_DATE - INTERVAL '3 days'
    GROUP BY DATE(fecha_hora)
    HAVING AVG(humedad_relativa) > $1
    ORDER BY dia DESC
  `,
    [UMBRALES.humedad_alta.limite],
  );

  if (result.rows.length >= UMBRALES.humedad_alta.dias_consecutivos) {
    const promedioGeneral = (
      result.rows.reduce((sum, r) => sum + parseFloat(r.humedad_promedio), 0) /
      result.rows.length
    ).toFixed(1);

    return await crearAlertaSiNoExiste(UMBRALES.humedad_alta, promedioGeneral);
  }

  if (result.rows.length < UMBRALES.humedad_alta.dias_consecutivos) {
    await autoResolverAlerta(
      "humedad_alta",
      `Humedad normalizada (${result.rows.length} días > 85%, se requieren ${UMBRALES.humedad_alta.dias_consecutivos})`,
    );
  }

  return null;
}

async function evaluarTemperaturaExtrema() {
  const result = await db.query(`
    SELECT temperatura_c, fecha_hora
    FROM clima
    ORDER BY fecha_hora DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) return null;

  const temp = parseFloat(result.rows[0].temperatura_c);

  if (temp > UMBRALES.temperatura_extrema.limite) {
    return await crearAlertaSiNoExiste(UMBRALES.temperatura_extrema, temp);
  }

  if (temp <= UMBRALES.temperatura_extrema.limite) {
    await autoResolverAlerta(
      "temperatura_extrema",
      `Temperatura normalizada: ${temp}°C`,
    );
  }

  return null;
}

async function evaluarFusarium() {
  const result = await db.query(`
    SELECT COALESCE(SUM(plantas_afectadas), 0) as total_afectadas
    FROM incidencias
    WHERE tipo = 'enfermedad'
      AND LOWER(agente) LIKE '%fusarium%'
      AND estado IN ('activa', 'controlada')
  `);

  const totalAfectadas = parseInt(result.rows[0]?.total_afectadas || 0);
  const porcentaje = ((totalAfectadas / TOTAL_PLANTAS) * 100).toFixed(1);

  if (parseFloat(porcentaje) > UMBRALES.fusarium.limite) {
    return await crearAlertaSiNoExiste(UMBRALES.fusarium, porcentaje);
  }

  return null;
}

async function evaluarAmarreBajo() {
  const result = await db.query(`
    SELECT amarre_porcentaje, semana, mes
    FROM kpis_semanales
    WHERE amarre_porcentaje IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) return null;

  const amarre = parseFloat(result.rows[0].amarre_porcentaje);

  if (amarre < UMBRALES.amarre_bajo.limite) {
    return await crearAlertaSiNoExiste(UMBRALES.amarre_bajo, amarre);
  }

  return null;
}

// ── Helpers internos ─────────────────────────────────────────

async function crearAlertaSiNoExiste(umbral, valorActual) {
  // Verificar si ya hay una alerta activa del mismo tipo
  const existente = await db.query(
    `SELECT id FROM alertas WHERE tipo = $1 AND estado = 'activa'`,
    [umbral.tipo],
  );

  if (existente.rows.length > 0) {
    // Actualizar el valor actual sin crear duplicado
    await db.query(
      `UPDATE alertas SET valor_actual = $1, mensaje = $2 WHERE id = $3`,
      [valorActual, umbral.mensaje(valorActual), existente.rows[0].id],
    );
    console.log(
      `[AlertEngine] Alerta ${umbral.tipo} actualizada — valor: ${valorActual}`,
    );
    return null;
  }

  // Crear nueva alerta
  const result = await db.query(
    `INSERT INTO alertas (tipo, severidad, mensaje, umbral, valor_actual, estado)
     VALUES ($1, $2, $3, $4, $5, 'activa')
     RETURNING *`,
    [
      umbral.tipo,
      umbral.severidad,
      umbral.mensaje(valorActual),
      umbral.umbral_texto,
      valorActual,
    ],
  );

  const alerta = result.rows[0];
  const id_registro = generateId("ALR", alerta.id);
  await db.query("UPDATE alertas SET id_registro = $1 WHERE id = $2", [
    id_registro,
    alerta.id,
  ]);
  alerta.id_registro = id_registro;

  console.log(
    `[AlertEngine] 🚨 NUEVA ALERTA: ${umbral.tipo} (${umbral.severidad}) — valor: ${valorActual}`,
  );
  return alerta;
}

async function autoResolverAlerta(tipo, nota) {
  const result = await db.query(
    `UPDATE alertas SET estado = 'resuelta', nota_resolucion = $1, resolved_at = NOW()
     WHERE tipo = $2 AND estado = 'activa' RETURNING id, id_registro`,
    [nota, tipo],
  );

  if (result.rows.length > 0) {
    console.log(`[AlertEngine] ✅ Alerta ${tipo} auto-resuelta: ${nota}`);
  }
}

// ── Evaluación completa (para cron jobs) ─────────────────────
async function evaluarTodo() {
  console.log("[AlertEngine] Ejecutando evaluación completa de umbrales...");

  const todas = [];

  const clima = await evaluarClima();
  todas.push(...clima);

  const fusarium = await evaluarFusarium();
  if (fusarium) todas.push(fusarium);

  const amarre = await evaluarAmarreBajo();
  if (amarre) todas.push(amarre);

  console.log(
    `[AlertEngine] Evaluación completa: ${todas.length} alertas nuevas generadas`,
  );
  return todas;
}

// ── Resumen de alertas activas ───────────────────────────────
async function resumenAlertas() {
  const result = await db.query(`
    SELECT tipo, severidad, mensaje, valor_actual, created_at
    FROM alertas WHERE estado = 'activa'
    ORDER BY
      CASE severidad WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 END,
      created_at DESC
  `);

  return {
    total_activas: result.rows.length,
    criticas: result.rows.filter((a) => a.severidad === "critica").length,
    altas: result.rows.filter((a) => a.severidad === "alta").length,
    medias: result.rows.filter((a) => a.severidad === "media").length,
    alertas: result.rows,
  };
}

module.exports = {
  evaluarClima,
  evaluarBitacora,
  evaluarIncidencia,
  evaluarTodo,
  resumenAlertas,
  UMBRALES,
  TOTAL_PLANTAS,
};
