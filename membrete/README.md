# Hoja membretada — Flor de Origen Benek

Formato institucional en Word, tamaño **Carta** (21.6 × 27.9 cm), listo para usar.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `Hoja-Membretada-Flor-de-Origen-Benek.docx` | Membrete **con estructura de carta** (fecha, destinatario, asunto, cuerpo, atentamente, firma). |
| `Hoja-Membretada-Flor-de-Origen-Benek-EN-BLANCO.docx` | Membrete **vacío**: solo encabezado y pie. Para oficios, cotizaciones, fichas técnicas, etc. |
| `Plantilla-Flor-de-Origen-Benek.dotx` | La misma carta, pero como **plantilla de Word**: al abrirla se crea un documento nuevo y el original nunca se sobrescribe. |
| `Plantilla-Flor-de-Origen-Benek-EN-BLANCO.dotx` | Versión en blanco como plantilla. |

Recomendación: usa los `.dotx` para el día a día y guarda los `.docx` como respaldo editable.

## Paso 1 — Poner tu logotipo real

El encabezado trae una **imagen de muestra** (recuadro punteado) del tamaño y la posición exactos del logo.

1. Abre el documento y haz **doble clic sobre el encabezado**.
2. **Clic derecho** sobre la imagen de muestra → **Cambiar imagen** → *Desde un archivo* → elige tu PNG del logo.
3. Word conserva el tamaño y la alineación. Cierra el encabezado (doble clic en el cuerpo).

Notas sobre el archivo del logo:

- Usa la **versión morada sobre fondo blanco** (o transparente) para impresión en oficina; el dorado sale gris en impresoras láser.
- El marcador es **cuadrado (1:1)**, igual que tus archivos de logo, así que la imagen no se deforma al reemplazarla.
- Si tu PNG trae mucho margen blanco alrededor, el logo se verá pequeño. En ese caso: selecciona la imagen → *Formato de imagen* → **Recortar** y ajusta hasta eliminar el aire sobrante.

Hay que repetir el paso en cada archivo (o hacerlo una sola vez en el `.dotx` y trabajar siempre desde ahí).

## Paso 2 — Rellenar los datos de la empresa

Todo lo que está entre corchetes `[ ]` es un marcador que debes reemplazar:

**En el encabezado** (doble clic arriba):
- `[Giro o eslogan de la empresa]`
- `[Calle y número, Colonia]`
- `[C.P.] [Ciudad], [Estado]`
- `Tel. [(999) 000 0000]` · `[correo@dominio.com]`
- `[www.flordeorigenbenek.com]`

**En el pie** (doble clic abajo):
- `RFC [XXXX000000XX0]` · `[Ciudad], [Estado], México`

Si no vas a usar algún dato (por ejemplo el RFC), borra ese fragmento junto con el separador `·`.

## Especificaciones de diseño

- **Papel:** Carta, 21.6 × 27.9 cm.
- **Márgenes:** 2.5 cm laterales, 3 cm inferior. El superior es dinámico: la primera hoja baja hasta ~5.5 cm por el encabezado grande y las hojas siguientes empiezan a 2.7 cm.
- **Colores de marca:** morado `#3A2158`, morado suave `#6B5A85`, dorado `#C6A052`, tinta `#2B2B2B`.
- **Tipografías:** Calibri para textos y datos; Georgia para el encabezado corto de las hojas 2 en adelante. Ambas vienen instaladas en Word por defecto en Windows y Mac.
- **Primera hoja:** logo a la izquierda, bloque de contacto alineado a la derecha, filete dorado de separación.
- **Hojas siguientes:** encabezado corto con el nombre de la marca y filete dorado, para no repetir el logo completo.
- **Pie en todas las hojas:** filete dorado, línea de datos fiscales y numeración `Página X de Y`.

## Regenerar los archivos

```bash
cd membrete
npm install
node make-placeholder.js   # regenera logo-placeholder.png
node build.js              # regenera los .docx
```

`build.js` concentra colores, medidas y textos en constantes al inicio del archivo, así que ahí se ajusta cualquier cambio de marca.
