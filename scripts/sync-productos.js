const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'alimentosdelnea.chesserp.com';
const USUARIO = process.env.CHESS_USUARIO;
const PASSWORD = process.env.CHESS_PASSWORD;

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
    console.log(`  Lote ${lote}: ${articulos.length} artículos (total acumulado: ${todos.length})`);
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

function getAgrupacion(eAgrupaciones, tipo) {
  const ag = eAgrupaciones?.find(a => a.idFormaAgrupar === tipo);
  return ag?.desAgrupacion || '';
}

async function main() {
  if (!USUARIO || !PASSWORD) throw new Error('Faltan CHESS_USUARIO y CHESS_PASSWORD');

  const sessionId = await login();
  const [articulos, precios] = await Promise.all([
    getArticulos(sessionId),
    getPrecios(sessionId)
  ]);

  const precioMap = {};
  for (const p of precios) {
    if (!p.Anulado) precioMap[p.id_articulo] = p.Precio_Final;
  }

  const productos = articulos
    .filter(a => !a.anulado && a.visibleMobile && precioMap[a.idArticulo] > 0)
    .map(a => ({
      id: a.idArticulo,
      nombre: a.desArticulo,
      unidadesBulto: a.unidadesBulto,
      codBarra: a.codBarraUnidad || '',
      familia: getAgrupacion(a.eAgrupaciones, 'FAMILIAS'),
      rubro: getAgrupacion(a.eAgrupaciones, 'RUBROS'),
      precio: precioMap[a.idArticulo] || 0
    }));

  console.log(`✅ Productos activos con precio: ${productos.length}`);

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