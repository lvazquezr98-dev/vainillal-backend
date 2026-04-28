# Vainillal Backend

Sistema de gestión inteligente para plantación de vainilla de 1 hectárea en Miguel Hidalgo, Coatzintla, Veracruz.

## Stack

- Backend: Node.js + Express v5
- Base de datos: PostgreSQL (Railway)
- Deploy: Railway
- API clima: WeatherAPI.com
- IA: Anthropic API (Opus + Sonnet)
- Sync visual: Notion API
- Auditoría: Google Sheets API v4

## Instalación

    git clone https://github.com/lvazquezr98-dev/vainillal-backend.git
    cd vainillal-backend
    npm install

## Ejecución

    npm run dev    (desarrollo con auto-restart)
    npm start      (producción)

## Endpoints

Base URL: http://localhost:3000/api/v1

Auth: Header X-API-Key

| Método | Ruta               | Descripción                  |
| ------ | ------------------ | ---------------------------- |
| GET    | /health            | Salud del sistema (sin auth) |
| POST   | /bitacora          | Crear registro               |
| GET    | /bitacora          | Listar registros             |
| GET    | /bitacora/:id      | Obtener por ID               |
| POST   | /aplicaciones      | Registrar producto           |
| GET    | /aplicaciones      | Listar aplicaciones          |
| POST   | /incidencias       | Reportar incidencia          |
| GET    | /incidencias       | Listar incidencias           |
| PUT    | /incidencias/:id   | Actualizar estado            |
| GET    | /clima/actual      | Clima actual                 |
| GET    | /clima/historial   | Historial clima              |
| GET    | /alertas           | Alertas activas              |
| PUT    | /alertas/:id       | Resolver alerta              |
| GET    | /plan/:mes         | Plan mensual                 |
| GET    | /plan/:mes/:semana | Plan semanal                 |
| GET    | /kpis/:semana      | KPIs semanales               |
| GET    | /kpis/resumen/:mes | Resumen mensual              |

## Base de datos

7 tablas en PostgreSQL: bitacora (BIT), aplicaciones (APP), incidencias (INC), clima (CLM), kpis_semanales (KPI), plan_operativo (PLN), alertas (ALR).

## Proyecto

Hito 1 - Infraestructura y Datos.
Vainillal Miguel Hidalgo, Coatzintla, Veracruz.
CEO: Luis Vázquez | Dev: TripleTen + Claude (Anthropic)
