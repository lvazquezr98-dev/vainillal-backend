// ============================================
// INICIALIZACIÓN DE BASE DE DATOS
// ============================================
// Este script crea todas las tablas en PostgreSQL.
// Se ejecuta UNA VEZ al arrancar el servidor.
// Si las tablas ya existen, no hace nada (IF NOT EXISTS).

const db = require("./database");

const initDB = async () => {
  try {
    // === TABLA: bitacora ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS bitacora (
        id SERIAL PRIMARY KEY,
        id_registro TEXT UNIQUE,
        actividad TEXT NOT NULL,
        fecha DATE NOT NULL,
        tipo TEXT NOT NULL,
        descripcion TEXT,
        datos_numericos DECIMAL,
        unidad TEXT,
        seccion_parcela TEXT,
        registrado_por TEXT NOT NULL,
        semana INTEGER,
        mes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // === TABLA: aplicaciones ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS aplicaciones (
        id SERIAL PRIMARY KEY,
        id_registro TEXT UNIQUE,
        producto TEXT NOT NULL,
        fecha DATE NOT NULL,
        tipo TEXT NOT NULL,
        dosis TEXT NOT NULL,
        area_aplicada TEXT,
        metodo TEXT NOT NULL,
        siguiente_aplicacion DATE,
        notas TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // === TABLA: incidencias ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS incidencias (
        id SERIAL PRIMARY KEY,
        id_registro TEXT UNIQUE,
        incidencia TEXT NOT NULL,
        fecha DATE NOT NULL,
        tipo TEXT NOT NULL,
        agente TEXT,
        severidad TEXT NOT NULL,
        ubicacion_parcela TEXT,
        plantas_afectadas INTEGER,
        accion_tomada TEXT,
        estado TEXT NOT NULL DEFAULT 'activa',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // === TABLA: clima ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS clima (
        id SERIAL PRIMARY KEY,
        id_registro TEXT UNIQUE,
        fecha_hora TIMESTAMPTZ NOT NULL,
        temperatura_c DECIMAL,
        sensacion_termica_c DECIMAL,
        humedad_relativa DECIMAL,
        precipitacion_mm DECIMAL,
        viento_kmh DECIMAL,
        condicion TEXT,
        fuente TEXT DEFAULT 'API',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // === TABLA: kpis_semanales ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS kpis_semanales (
        id SERIAL PRIMARY KEY,
        id_registro TEXT UNIQUE,
        semana INTEGER NOT NULL,
        mes TEXT NOT NULL,
        racimos_polinizados INTEGER,
        amarre_porcentaje DECIMAL,
        aborto_porcentaje DECIMAL,
        plantas_fusarium INTEGER,
        dias_sin_lluvia INTEGER,
        precipitacion_acumulada_mm DECIMAL,
        guias_encauzadas INTEGER,
        calles_limpiadas_porcentaje DECIMAL,
        estado_general TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // === TABLA: plan_operativo ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS plan_operativo (
        id SERIAL PRIMARY KEY,
        id_registro TEXT UNIQUE,
        tarea TEXT NOT NULL,
        mes TEXT NOT NULL,
        semana INTEGER,
        tipo TEXT,
        frecuencia TEXT,
        kpi_esperado TEXT,
        estado TEXT DEFAULT 'pendiente',
        prioridad TEXT,
        fecha_inicio DATE,
        fecha_fin DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // === TABLA: alertas ===
    await db.query(`
      CREATE TABLE IF NOT EXISTS alertas (
        id SERIAL PRIMARY KEY,
        tipo TEXT NOT NULL,
        severidad TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        umbral TEXT,
        valor_actual DECIMAL,
        estado TEXT DEFAULT 'activa',
        nota_resolucion TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      )
    `);

    console.log("✅ Tablas creadas correctamente en PostgreSQL");
  } catch (error) {
    console.error("❌ Error creando tablas:", error.message);
  }
};

module.exports = initDB;
