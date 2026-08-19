const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" fill="#FFFFFF"/>
  <rect x="14" y="14" width="872" height="872" fill="#F7F4FA" stroke="#3A2158"
        stroke-width="6" stroke-dasharray="26 20" rx="10"/>
  <g font-family="DejaVu Serif, serif" text-anchor="middle" fill="#3A2158">
    <text x="450" y="330" font-size="128" font-weight="bold" letter-spacing="14">FLOR</text>
    <text x="450" y="440" font-size="70" font-style="italic">de</text>
    <text x="450" y="560" font-size="112" font-weight="bold" letter-spacing="8">ORIGEN</text>
    <text x="450" y="650" font-size="52" letter-spacing="22" fill="#8A7BA0">BENEK</text>
  </g>
  <line x1="180" y1="410" x2="380" y2="410" stroke="#C6A052" stroke-width="5"/>
  <line x1="520" y1="410" x2="720" y2="410" stroke="#C6A052" stroke-width="5"/>
  <g font-family="DejaVu Sans, sans-serif" text-anchor="middle" fill="#B03A3A">
    <text x="450" y="790" font-size="34" font-weight="bold" letter-spacing="3">IMAGEN DE MUESTRA</text>
    <text x="450" y="838" font-size="27">Clic derecho &#8594; Cambiar imagen</text>
  </g>
</svg>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${SVG}</body>`);
  await page.screenshot({ path: '/home/user/vainillal-backend/membrete/logo-placeholder.png', omitBackground: false });
  await browser.close();
  console.log('placeholder listo');
})();
