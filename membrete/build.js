const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, VerticalAlign, Header, Footer,
  PageNumber, TabStopType, TabStopPosition, LineRuleType,
} = require('docx');

// ---------- Marca ----------
const MORADO      = '3A2158';
const MORADO_SUAVE= '6B5A85';
const DORADO      = 'C6A052';
const TINTA       = '2B2B2B';

const SERIF = 'Georgia';
const SANS  = 'Calibri';

// ---------- Medidas (DXA: 1 cm = 566.93) ----------
const CM = (n) => Math.round(n * 566.93);
const PX = (cm) => Math.round((cm / 2.54) * 96); // cm -> px @96dpi para ImageRun

const PAGE_W = 12240, PAGE_H = 15840;            // Carta
const MARGEN_LAT = CM(2.5);
const ANCHO_UTIL = PAGE_W - MARGEN_LAT * 2;      // 9406
const COL_LOGO   = CM(4.2);
const COL_DATOS  = ANCHO_UTIL - COL_LOGO;

const LOGO = fs.readFileSync(__dirname + '/logo-placeholder.png');
const LOGO_CM = 3.6;

const SIN_BORDES = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const reglaDorada = (grosor = 8, despues = 0) => new Paragraph({
  spacing: { before: 80, after: despues, line: 20, lineRule: LineRuleType.EXACT },
  border: { bottom: { style: BorderStyle.SINGLE, size: grosor, space: 1, color: DORADO } },
});

const datoContacto = (texto, opts = {}) => new Paragraph({
  alignment: AlignmentType.RIGHT,
  spacing: { before: 0, after: 0, line: 230, lineRule: LineRuleType.AUTO },
  children: [new TextRun({
    text: texto,
    font: SANS,
    size: opts.size || 17,               // half-points -> 8.5 pt
    color: opts.color || MORADO_SUAVE,
    bold: !!opts.bold,
    characterSpacing: opts.spacing || 0,
  })],
});

// ---------- Encabezado de la primera hoja ----------
const encabezadoPrimera = new Header({
  children: [
    new Table({
      columnWidths: [COL_LOGO, COL_DATOS],
      borders: SIN_BORDES,
      width: { size: ANCHO_UTIL, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: COL_LOGO, type: WidthType.DXA },
              borders: SIN_BORDES,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 0, bottom: 0, left: 0, right: CM(0.3) },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 0 },
                  children: [new ImageRun({
                    type: 'png',
                    data: LOGO,
                    transformation: { width: PX(LOGO_CM), height: PX(LOGO_CM) },
                    altText: { title: 'Logotipo', description: 'Logotipo Flor de Origen Benek', name: 'logo' },
                  })],
                }),
              ],
            }),
            new TableCell({
              width: { size: COL_DATOS, type: WidthType.DXA },
              borders: SIN_BORDES,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [
                datoContacto('FLOR DE ORIGEN BENEK', { size: 21, bold: true, color: MORADO, spacing: 24 }),
                datoContacto('[Giro o eslogan de la empresa]', { size: 15 }),
                new Paragraph({ spacing: { before: 60, after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] }),
                datoContacto('[Calle y número, Colonia]'),
                datoContacto('[C.P.] [Ciudad], [Estado]'),
                datoContacto('Tel. [(999) 000 0000]  ·  [correo@dominio.com]'),
                datoContacto('[www.flordeorigenbenek.com]'),
              ],
            }),
          ],
        }),
      ],
    }),
    reglaDorada(10, 300),
  ],
});

// ---------- Encabezado de hojas siguientes ----------
const encabezadoSiguientes = new Header({
  children: [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({
        text: 'FLOR DE ORIGEN BENEK',
        font: SERIF, size: 17, bold: true, color: MORADO, characterSpacing: 30,
      })],
    }),
    reglaDorada(6, 200),
  ],
});

// ---------- Pie de página ----------
const pie = () => new Footer({
  children: [
    new Paragraph({
      spacing: { before: 0, after: 100, line: 20, lineRule: LineRuleType.EXACT },
      border: { top: { style: BorderStyle.SINGLE, size: 6, space: 1, color: DORADO } },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({
        text: 'Flor de Origen Benek  ·  RFC [XXXX000000XX0]  ·  [Ciudad], [Estado], México',
        font: SANS, size: 15, color: MORADO_SUAVE, characterSpacing: 8,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 30, after: 0 },
      children: [
        new TextRun({ text: 'Página ', font: SANS, size: 14, color: MORADO_SUAVE }),
        new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 14, color: MORADO_SUAVE }),
        new TextRun({ text: ' de ', font: SANS, size: 14, color: MORADO_SUAVE }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: SANS, size: 14, color: MORADO_SUAVE }),
      ],
    }),
  ],
});

// ---------- Cuerpo ----------
const p = (text, o = {}) => new Paragraph({
  alignment: o.align || AlignmentType.JUSTIFIED,
  spacing: { before: o.before ?? 0, after: o.after ?? 200, line: 300, lineRule: LineRuleType.AUTO },
  children: [new TextRun({
    text, font: o.font || SANS, size: o.size || 22, bold: !!o.bold,
    color: o.color || TINTA, characterSpacing: o.spacing || 0, italics: !!o.italics,
  })],
});

const vacio = (alto = 200) => new Paragraph({ spacing: { before: 0, after: alto, line: 20, lineRule: LineRuleType.EXACT }, children: [] });

function cuerpoCarta() {
  return [
    p('[Ciudad], a ____ de ______________ de 20____.', { align: AlignmentType.RIGHT, after: 400 }),

    p('[NOMBRE DEL DESTINATARIO]', { align: AlignmentType.LEFT, bold: true, after: 0 }),
    p('[Cargo]', { align: AlignmentType.LEFT, after: 0 }),
    p('[Empresa o institución]', { align: AlignmentType.LEFT, after: 100 }),
    p('P R E S E N T E', { align: AlignmentType.LEFT, bold: true, spacing: 10, after: 300 }),

    p('Asunto: [Escriba aquí el asunto]', { align: AlignmentType.LEFT, bold: true, after: 300 }),

    p('Estimado(a) [Nombre]:', { align: AlignmentType.LEFT, after: 240 }),

    p('Por medio de la presente reciba un cordial saludo de parte de Flor de Origen Benek. [Escriba aquí el primer párrafo del cuerpo de la carta: el motivo de la comunicación, expuesto de forma breve y directa.]'),
    p('[Segundo párrafo: desarrolle los detalles, antecedentes, condiciones o información de soporte que el destinatario necesita conocer.]'),
    p('[Tercer párrafo: indique la acción esperada, la fecha compromiso o la respuesta que solicita.]', { after: 300 }),

    p('Sin más por el momento, quedo a sus órdenes para cualquier aclaración.', { after: 600 }),

    p('A T E N T A M E N T E', { align: AlignmentType.CENTER, bold: true, spacing: 20, color: MORADO, after: 700 }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80, line: 20, lineRule: LineRuleType.EXACT },
      indent: { left: CM(4.5), right: CM(4.5) },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: MORADO } },
    }),
    p('[Nombre completo]', { align: AlignmentType.CENTER, bold: true, after: 0 }),
    p('[Cargo]', { align: AlignmentType.CENTER, size: 20, color: MORADO_SUAVE, after: 0 }),
    p('Flor de Origen Benek', { align: AlignmentType.CENTER, size: 20, color: MORADO_SUAVE }),
  ];
}

function cuerpoBlanco() {
  return [
    vacio(0),
    p('[Escriba aquí el contenido del documento.]', { align: AlignmentType.LEFT, color: MORADO_SUAVE, italics: true }),
  ];
}

function construir(children) {
  return new Document({
    creator: 'Flor de Origen Benek',
    title: 'Hoja membretada — Flor de Origen Benek',
    description: 'Formato de hoja membretada institucional',
    styles: {
      default: {
        document: {
          run: { font: SANS, size: 22, color: TINTA },
          paragraph: { spacing: { line: 300, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [{
      properties: {
        titlePage: true,
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: {
            top: CM(2.7), right: MARGEN_LAT, bottom: CM(3.0), left: MARGEN_LAT,
            header: CM(1.0), footer: CM(1.1),
          },
        },
      },
      headers: { first: encabezadoPrimera, default: encabezadoSiguientes },
      footers: { first: pie(), default: pie() },
      children,
    }],
  });
}

// Convierte un .docx en plantilla .dotx cambiando el content-type de document.xml.
const CT_DOC = 'wordprocessingml.document.main+xml';
const CT_TPL = 'wordprocessingml.template.main+xml';

async function aPlantilla(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const ct = await zip.file('[Content_Types].xml').async('string');
  zip.file('[Content_Types].xml', ct.replace(CT_DOC, CT_TPL));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

(async () => {
  const salidas = [
    ['Hoja-Membretada-Flor-de-Origen-Benek.docx', 'Plantilla-Flor-de-Origen-Benek.dotx', cuerpoCarta()],
    ['Hoja-Membretada-Flor-de-Origen-Benek-EN-BLANCO.docx', 'Plantilla-Flor-de-Origen-Benek-EN-BLANCO.dotx', cuerpoBlanco()],
  ];
  for (const [docx, dotx, children] of salidas) {
    const buf = await Packer.toBuffer(construir(children));
    fs.writeFileSync(__dirname + '/' + docx, buf);
    console.log('✓', docx, (buf.length / 1024).toFixed(0) + ' KB');

    const tpl = await aPlantilla(buf);
    fs.writeFileSync(__dirname + '/' + dotx, tpl);
    console.log('✓', dotx, (tpl.length / 1024).toFixed(0) + ' KB');
  }
})();
