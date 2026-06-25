const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'alimentosdelnea.chesserp.com';
const USUARIO = process.env.CHESS_USUARIO;
const PASSWORD = process.env.CHESS_PASSWORD;
const ID_DEPOSITO = 2;
const FAMILIAS_EXCLUIDAS = new Set([
  'CONGELADOS.',
  'ENVASE',
  'VARIOS',
  'OTROS.',
  'FINANCIERO',
  'MATERIAL POP'  
]);

// IDs de productos específicos que no deben aparecer
const PRODUCTOS_EXCLUIDOS = new Set([
  900,   // SOMBRILLA + BASE
  905,   // PALLET MADERA BLANCA
  9000,  // RECARGO FINANCIERO
  2776,
  61679,
  10105,
  1070
]);

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`Error parseando respuesta: ${data.substring(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function login() {
  const body = JSON.stringify({ usuario: USUARIO, password: PASSWORD });
  const res = await request({
    hostname: BASE,
    path: '/AR965/web/api/chess/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
  if (!res.body.sessionId) throw new Error('Login fallido: ' + JSON.stringify(res.body));
  console.log('✅ Login OK');
  return res.body.sessionId;
}

async function getArticulos(sessionId) {
  let todos = [];
  let lote = 1;

  while (true) {
    const res = await request({
      hostname: BASE,
      path: `/AR965/web/api/chess/v1/articulos/?nroLote=${lote}`,
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Cookie': sessionId }
    });

    const articulos = res.body?.Articulos?.eArticulos || [];
    if (articulos.length === 0) break;

    todos = todos.concat(articulos);
    console.log(`  Lote ${lote}: ${articulos.length} artículos (total: ${todos.length})`);
    lote++;
  }

  console.log(`✅ Total artículos: ${todos.length}`);
  return todos;
}

async function getPrecios(sessionId) {
  const res = await request({
    hostname: BASE,
    path: '/AR965/web/api/chess/v1/listaPrecios/?Lista=3',
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Cookie': sessionId }
  });
  const precios = res.body?.dsListaPreciosApi?.eListaPrecios || [];
  console.log(`✅ Precios: ${precios.length}`);
  return precios;
}

async function getStock(sessionId) {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

  const res = await request({
    hostname: BASE,
    path: `/AR965/web/api/chess/v1/stock/?idDeposito=${ID_DEPOSITO}&frescura=true&fechaStock=${encodeURIComponent(fecha)}`,
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Cookie': sessionId }
  });

  const items = res.body?.dsStockFisicoApi?.dsStock || [];
  console.log(`✅ Registros de stock: ${items.length}`);

  // Sumar cantBultos por idArticulo
  const stockMap = {};
  for (const item of items) {
    if (!stockMap[item.idArticulo]) stockMap[item.idArticulo] = 0;
    stockMap[item.idArticulo] += item.cantBultos || 0;
  }

  const conStock = Object.values(stockMap).filter(v => v > 0).length;
  console.log(`✅ Artículos con stock > 0: ${conStock}`);

  return stockMap;
}

function getAgrupacion(eAgrupaciones, tipo) {
  const ag = eAgrupaciones?.find(a => a.idFormaAgrupar === tipo);
  return ag?.desAgrupacion || '';
}

async function main() {
  if (!USUARIO || !PASSWORD) throw new Error('Faltan CHESS_USUARIO y CHESS_PASSWORD');

  const sessionId = await login();

  const [articulos, precios, stockMap] = await Promise.all([
    getArticulos(sessionId),
    getPrecios(sessionId),
    getStock(sessionId)
  ]);

  const precioMap = {};
const bonificacionMap = {};
for (const p of precios) {
  if (!p.Anulado) {
    precioMap[p.id_articulo] = p.Precio_Final;
    bonificacionMap[p.id_articulo] = p.Precio_Bonificacion || 0;
  }
}

  const productos = articulos
   .filter(a =>
  !a.anulado &&
  precioMap[a.idArticulo] > 0 &&
  (stockMap[a.idArticulo] || 0) > 0 &&
  !FAMILIAS_EXCLUIDAS.has(getAgrupacion(a.eAgrupaciones, 'FAMILIAS')) &&
  !PRODUCTOS_EXCLUIDOS.has(a.idArticulo)
)

   .map(a => ({
  id: a.idArticulo,
  nombre: a.desArticulo,
  unidadesBulto: a.unidadesBulto,
  codBarra: a.codBarraUnidad || '',
  familia: getAgrupacion(a.eAgrupaciones, 'FAMILIAS'),
  rubro: getAgrupacion(a.eAgrupaciones, 'RUBROS'),
  precio: precioMap[a.idArticulo] || 0,
  descuento: bonificacionMap[a.idArticulo] || 0,  // ← nuevo
  stock: stockMap[a.idArticulo] || 0
}));

  console.log(`✅ Productos con precio y stock: ${productos.length}`);

  const output = {
    ultima_actualizacion: new Date().toISOString(),
    total: productos.length,
    productos
  };

  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'productos.json'), JSON.stringify(output, null, 2));
  console.log('✅ Guardado en data/productos.json');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

